/*eslint-disable */
// This is your test publishable API key.
import axios from 'axios';

export const bookTour = async (tourId) => {
  const stripe = Stripe(
    'pk_test_51NVKDBGB3eeV2MLO8TjjjElvZW3p9wqaUfoqprFGhyze38bXxA3ToKNUl8fD46rT2Hlo1kctEcRXZwm3rtjOmLcK00APCbxlgC'
  );
  // 1) Get checkout session from API
  try {
    const session = await axios({
      method: 'GET',
      url: `/api/v1/booking/checkout-session/${tourId}`,
    });
    // 2) Create checkout form + chanre credit card */
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    //console.log(err.message);
  }
};
