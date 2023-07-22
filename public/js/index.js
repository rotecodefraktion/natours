import { displayMap } from './mapbox';
import { login, logout, forgotPW } from './login';
import { signup } from './signup';
import { storeImageData, updateUserData, resetPW } from './account';
import { sorttours } from './managetours';
import { showAlert } from './alerts';
import { bookTour } from './stripe';

const mapbox = document.getElementById('map');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.querySelector('.nav__el--logout');
const updateUserForm = document.querySelector('.form-user-data');
const resetForm = document.getElementById('reset');
const manageTourSelect = document.getElementById('tourSort');
const manageTourOrder = document.getElementById('tourOrder');
const pageLimit = document.getElementById('pageLimit');
const signupForm = document.getElementById('signupForm');
const bookBtn = document.getElementById('book-tour');

if (loginForm) {
  //console.log('signupForm', signupForm);
  document.querySelector('.form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });

  document.querySelector('.form__link').addEventListener('click', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    forgotPW(email);
  });
}

if (resetForm) {
  const token = JSON.parse(resetForm.dataset.token);
  //console.log('token', token);
  document.querySelector('.resetpwform').addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;
    resetPW(password, passwordConfirm, `${token}`);
  });
}

if (mapbox) {
  const locations = JSON.parse(mapbox.dataset.locations);
  const apiKey = JSON.parse(mapbox.dataset.apikey);
  displayMap(locations, apiKey);
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    logout();
  });
}

if (updateUserForm) {
  document.getElementById('photo').addEventListener('change', (e) => {
    const imgPreview = document.getElementById('img-preview');
    const files = document.getElementById('photo').files[0];
    //console.log('files', files);
    if (files) {
      storeImageData(files);
    }
  });

  document
    .querySelector('.userPWForm.form-user-settings')
    .addEventListener('submit', (e) => {
      //console.log('updatePasswordForm submit');
      e.preventDefault();

      const data = {
        passwordCurrent: document.getElementById('password-current').value,
        password: document.getElementById('password').value,
        passwordConfirm: document.getElementById('password-confirm').value,
      };
      updateUserData(data, 'password');
    });

  document
    .querySelector('.userDataForm.form-user-data') //
    .addEventListener('submit', (e) => {
      e.preventDefault();

      const data = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        photo: document.getElementById('userphoto').src,
      };
      updateUserData(data, 'data');
    });
}

if (manageTourSelect) {
  //const limit = JSON.parse(pageLimit.dataset.limit);
  //console.log('limit', limit);
  manageTourSelect.addEventListener('change', (e) => {
    e.preventDefault();
    const sort = e.target.value;
    const order = manageTourOrder.value;
    sorttours(sort, order, limit);
  });
  manageTourOrder.addEventListener('change', (e) => {
    e.preventDefault();
    const sort = manageTourSelect.value;
    const order = e.target.value;
    sorttours(sort, order, limit);
  });
}

if (signupForm) {
  //console.log('signupForm', signupForm);
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;
    if (password !== passwordConfirm) {
      showAlert('error', 'Passwords do not match');
      return;
    } else {
      signup(name, email, password);
    }
  });
}

if (bookBtn) {
  bookBtn.addEventListener('click', (e) => {
    //const tourId = e.target.dataset.tourid;
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;
    //console.log('tourId', tourId);
    bookTour(tourId);
  });
}
