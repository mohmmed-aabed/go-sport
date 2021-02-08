'use strict';

// ------------------------------------------------------
// --------------------- WORKOUT CLASS ---------------------
// ------------------------------------------------------
class Workout {
  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lang]
    this.distance = distance; // in km
    this.duration = duration; // in min
    this.date = new Date();
    this.id = (Date.now() + '').slice(-10);
  }

  // ------------------------------------
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

// ------------------------------------------------------
// --------------------- RUNNING CLASS ---------------------
// ------------------------------------------------------
class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this.type = 'running';
    this._setDescription();
  }

  // ------------------------------------
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

// ------------------------------------------------------
// --------------------- CYCLING Workout ---------------------
// ------------------------------------------------------
class Cycling extends Workout {
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this.type = 'cycling';
    this._setDescription();
  }

  // ------------------------------------
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// ------------------------------------------------------
// --------------------- APP CLASS ---------------------
// ------------------------------------------------------
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  constructor() {
    this.workouts = [];
    this.map;
    this.mapEvent;
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    // Get data from local storage
    this._getLocalStorage();
  }

  // ------------------------------------
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your location');
        }
      );
    }
  }

  // ------------------------------------
  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    this.map = L.map('map').setView([latitude, longitude], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    L.marker([latitude, longitude]).addTo(this.map);
    this.map.on('click', this._showForm.bind(this));

    this.workouts.forEach((workout) => {
      this._renderWorkoutMarker(workout);
    });
  }

  // ------------------------------------
  _showForm(event) {
    this.mapEvent = event;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  // ------------------------------------
  _hideForm() {
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value =
      '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => {
      form.style.display = 'grid';
    }, 1000);
  }

  // ------------------------------------
  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  // ------------------------------------
  _newWorkout(event) {
    event.preventDefault();

    const areNumbers = (...inputs) => {
      return inputs.every((input) => Number.isFinite(input));
    };

    const arePositives = (...inputs) => {
      return inputs.every((input) => input > 0);
    };

    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.mapEvent.latlng;
    let workout;

    // New Running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      //  Check if data is valid
      if (!areNumbers(distance, duration, cadence)) {
        return alert('Please enter a number!');
      }
      if (!arePositives(distance, duration, cadence)) {
        return alert('Input has to be positive!');
      }
      // Create object
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // New Cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      //  Check if data is valid
      if (!areNumbers(distance, duration, elevation)) {
        return alert('Please enter a number!');
      }
      if (!arePositives(distance, duration)) {
        return alert('Input has to be positive!');
      }
      // Create object
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new object to workout array
    this.workouts.push(workout);

    // Render workout on map
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    // Clear input fields + Hide form
    this._hideForm();

    // Set local storage to all workouts
    this._setLocalStorage();
  }

  // ------------------------------------
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  // ------------------------------------
  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
    `;

    if (workout.type === 'running') {
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>
      `;
    }

    if (workout.type === 'cycling') {
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
    </li>
      `;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  // ------------------------------------
  _moveToPopup(event) {
    const element = event.target.closest('.workout');
    if (!element) return;
    const workout = this.workouts.find(
      (workout) => workout.id === element.dataset.id
    );

    this.map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  // ------------------------------------
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.workouts));
  }

  // ------------------------------------
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.workouts = data;

    this.workouts.forEach((workout) => {
      this._renderWorkout(workout);
    });
  }

  // ------------------------------------
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

// ------------------------------------------------------
const app = new App();
// ------------------------------------------------------
