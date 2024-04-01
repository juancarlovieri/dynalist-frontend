import './App.css';
import Node from './Node';
import axios from 'axios';
import React from 'react';

export default class App extends React.Component {
  state = {
    root: {id: -1, info: "This is your notes!", children: []}
  }

  constructor(props) {
    super(props)
    this.ref = {};
  }

  componentDidMount() {
    axios.get(`${process.env.REACT_APP_BACKEND_URL}`)
    .then(res => {
      const tmpNode = res.data.map((v, i) => ({...v, i: i + 1}));

      const idx = new Map();
      tmpNode.forEach(({id, i}) => idx.set(id, i));
      idx.set(0, 0);

      const nodes = [{id: 0, prev: {id: 0}, next: {id: 0}, parent: {id: 0}, info: "", children: []}].concat(tmpNode.map(({id, info, prev, next}) => ({id, info, children: new Array(0), prev, next})));

      tmpNode.forEach(({parent, i}) => nodes[i].parent = nodes[idx.get(parent)]);
      tmpNode.filter(({prev}) => prev === 0)
        .forEach(({parent, i}) => nodes[idx.get(parent)].children.push(nodes[i]));

      nodes.forEach(({children}) => {
          if (children.length === 0) return;
          children[0].prev = {id: 0};
          while (children.slice(-1)[0].next !== 0) {
            let cur = children.slice(-1)[0];
            const next = idx.get(cur.next);
            cur.next = nodes[next];
            children.push(nodes[next]);
            children.slice(-1)[0].prev = cur;
          }
          children.slice(-1)[0].next = {id: 0};
        });


      const root = nodes.filter(n => (n.id === 0))[0];
      this.setState({root})
    })
  }



  render() {
    return (
      <div className="App">
        <Node key={this.state.root.id} node={this.state.root} />
      </div>
    );
  }
}

