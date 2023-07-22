//import { doc } from 'prettier';
import { showAlert } from './alerts';
import { login } from './login';
import axios from 'axios';

export const storeImageData = async (files) => {
  const file = files[0];
  if (files) {
    const form = new FormData();
    form.append('photo', document.getElementById('photo').files[0]);
    const url = '/api/v1/users/uploadImage';
    try {
      const res = await axios({
        method: 'POST',
        url,
        data: form,
      });

      showAlert('success', 'Image succesfully uploaded');
      document.getElementById('userphoto').src = `/img/users/${res.data.data}`;
      document.getElementsByClassName(
        'nav__user-img'
      )[0].src = `/img/users/${res.data.data}`;
    } catch (err) {
      showAlert('error', err.response.data.message);
      //showAlert('error', err);
    }
  } else {
    showAlert('error', 'No file selected');
  }
};
export const updateUserData = async (data, type) => {
  const url =
    type === 'password'
      ? '/api/v1/users/updatemypassword'
      : '/api/v1/users/updateme';
  //console.log(url);
  try {
    const res = await axios({
      method: 'PATCH',
      url,
      data, // name: name, email: email
    });

    if (res.data.status === 'success') {
      if (type === 'password') {
        document.getElementById('password-current').value = '';
        document.getElementById('password').value = '';
        document.getElementById('password-confirm').value = '';
        showAlert('success', 'Password updated successfully');
      } else {
        showAlert('success', 'Data updated successfully');
      }
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const forgotPW = async (email) => {
  const validRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  if (!email.match(validRegex)) {
    showAlert('error', 'Please provide a valid email');
    return;
  }
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/forgotPassword',
      data: {
        email,
      },
    });
    //console.log(res.data);
    if (res.data.status === 'success') {
      showAlert('success', 'Reset Email sent successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 2000);
    }
  } catch (err) {
    //console.log('error', err.response.data.message);
    showAlert('error', err.response.data.message);
  }
};

export const resetPW = async (password, passwordConfirm, token) => {
  if (password !== passwordConfirm) {
    showAlert('error', 'Passwords do not match');
    return;
  }

  try {
    const res = await axios({
      method: 'PATCH',
      url: `/api/v1/users/resetPassword/${token}`,
      data: {
        password,
        passwordConfirm,
      },
    });
    //console.log(res.data);
    if (res.data.status === 'success') {
      login(res.data.data.user.email, password);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
