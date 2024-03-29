import './App.css';
import Node from './Node';
import axios from 'axios';
import React from 'react';

export default class App extends React.Component {
  state = {
    roots: [{info: "", children: []}]
  }

  componentDidMount() {
    axios.get(`${process.env.REACT_APP_BACKEND_URL}`)
    .then(res => {
      const tmpNode = res.data;

      const idx = new Map();
      tmpNode.forEach(({id}, i) => idx.set(id, i));

      const nodes = tmpNode.map(({id, info}) => ({id, info, children: []}));
      tmpNode.filter(({parent}) => parent !== 0).forEach(({parent}, i) => {nodes[i].parent = nodes[idx.get(parent)]; nodes[idx.get(parent)].children.push(nodes[i])});

      this.setState({roots: nodes.filter(n => !n.parent)});
    })
  } 

  render() {
    return (
      <div className="App">
        {this.state.roots.map(n => <Node node={n}/>)}
      </div>
    );
  }
}

