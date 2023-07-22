import axios from 'axios';
import { showAlert } from './alerts';
import { hideAlert } from './alerts';

export const signup = async (name, email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data: {
        name,
        email,
        password,
        passwordConfirm: password,
      },
    });
    //console.log(res.data);
    if (res.data.status === 'success') {
      showAlert('success', 'Signup successful, please check your email');
      window.setTimeout(() => {
        location.assign('/');
      }, 1000);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
  //console.log('signup', name, email, password);
};
