import React, { Component } from 'react';
import './App.css';
import InfiniteScrollView from './CustomInfiniteScrollView1/InfiniteScrollView';

class App extends Component {
  render() {
    return (
      <div className="App">
        <InfiniteScrollView />
      </div>
    );
  }
}

export default App;
