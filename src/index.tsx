import ReactDOM from 'react-dom';
import './index.css';
import Canvas from './Canvas';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import { Atoms } from './examples/Atoms';
import { Selectors } from './examples/Selectors';
import { Async } from './examples/Async';
// import { AtomEffects1 } from './examples/AtomEffects1';
// import { AtomEffects2 } from './examples/AtomEffects2';
// import { AtomEffects3 } from './examples/AtomEffects3';
import { AtomEffects4 } from './examples/AtomEffects4';
import { Suspense } from 'react';

ReactDOM.render(
  <RecoilRoot>
    <ChakraProvider>
      <Router>
        <Switch>
          <Route path="/examples/atoms">
            <Atoms />
          </Route>
          <Route path="/examples/selectors">
            <Selectors />
          </Route>
          <Route path="/examples/async">
            <Async />
          </Route>
          <Route path="/examples/atom-effects">
            {/* <AtomEffects1 /> */}
            {/* <AtomEffects2 /> */}
            <Suspense fallback={<div>Loading...</div>}>
              {/* <AtomEffects3 /> */}
              <AtomEffects4 />
            </Suspense>
          </Route>
          <Route>
            <Canvas />
          </Route>
        </Switch>
      </Router>
    </ChakraProvider>
  </RecoilRoot>,
  document.getElementById('root'),
);
