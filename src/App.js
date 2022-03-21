import { Provider } from 'react-redux';
import store from './react-redux-store/store.js';

import MainContainer from './Main/MainContainer';

function App() {
  return (
    <Provider store={store}>
      <MainContainer/>
    </Provider>
  );
}

export default App;
