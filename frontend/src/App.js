import './App.css';
import Node from './Node';
import axios from 'axios';
import React from 'react';

export default class App extends React.Component {
  state = {
    roots: [{id: 0, info: "This is your notes!", children: []}]
  }

  constructor(props) {
    super(props)
    this.ref = {};

    this.updateChild = this.updateChild.bind(this);
    this.insert = this.insert.bind(this);
    this.insertId = this.insertId.bind(this);
    this.indent = this.indent.bind(this);
    this.indentId = this.indentId.bind(this);
    this.erase = this.erase.bind(this);
    this.eraseId = this.eraseId.bind(this);
    this.focusPrev = this.focusPrev.bind(this);
    this.focusNext = this.focusNext.bind(this);
    this.focusLast = this.focusLast.bind(this);
    this.swap = this.swap.bind(this);
    this.checkSwap = this.checkSwap.bind(this);
  }

  componentDidMount() {
    axios.get(`${process.env.REACT_APP_BACKEND_URL}`)
    .then(res => {
      const tmpNode = res.data.map((v, i) => ({...v, i}));

      const idx = new Map();
      tmpNode.forEach(({id, i}) => idx.set(id, i));

      const nodes = tmpNode.map(({id, info, prev, next}) => ({id, info, children: new Array(0), prev, next}));

      tmpNode.filter(({parent}) => parent !== 0)
        .forEach(({parent, i}) => nodes[i].parent = nodes[idx.get(parent)]);
      tmpNode.filter(({prev, parent}) => prev === 0 && parent !== 0)
        .forEach(({parent, i}) => nodes[idx.get(parent)].children.push(nodes[i]));
      tmpNode.filter(({parent}) => parent === 0).forEach(({i}) => nodes[i].parent = {id: 0});

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


      const roots = nodes.filter(n => (n.parent.id === 0 && n.prev === 0));
      roots[0].prev = {id: 0};
      while (roots.slice(-1)[0].next !== 0) {
        let cur = roots.slice(-1)[0];
        const next = idx.get(cur.next);
        cur.next = nodes[next];
        roots.push(nodes[next]);
        roots.slice(-1)[0].prev = cur;
      }
      roots.slice(-1)[0].next = {id: 0};
      this.setState({roots});
    })
  }

  updateChild(id, child, cb) {
    const roots = this.state.roots;
    roots.map((n, i) => ({...n, i})).filter(n => n.id === id).forEach(({i}) => roots[i] = child);
    this.setState({roots}, cb);
  }

  async saveNode(node) {
    const converted = {
      info: node.info,
      parent: node.parent.id,
      prev: node.prev.id,
      next: node.next.id
    };
    await axios.put(`${process.env.REACT_APP_BACKEND_URL}/update?id=${node.id}`, converted)
  }

  async insertId(id, node) {
    this.state.roots.map((n, i) => ({...n, i})).filter(n => n.id === id).forEach(({i}) => this.insert(i, node));
  }
  
  async insert(i, node, cb) {
    let tmp = this.state.roots;

    if (i !== -1) {
      tmp[i].next = node;
      node.prev = tmp[i];
    } else {
      node.prev = {id: 0};
    }

    if (i !== tmp.length - 1) {
      tmp[i + 1].prev = node;
      node.next = tmp[i + 1];
    } else {
      node.next = {id: 0};
    }

    tmp.splice(i + 1, 0, node);
    if (i !== -1) await this.saveNode(tmp[i]);
    await this.saveNode(tmp[i + 1]);
    if (i !== tmp.length - 2) await this.saveNode(tmp[i + 2]);


    this.setState({roots: tmp}, () => {
      this.ref[node.id].input.focus(); 
      if (typeof(cb) === "function") cb();
    });
  }
  
  
  async eraseId(id) {
    this.state.roots.map((n, i) => ({...n, i})).filter(n => n.id === id).forEach(({i}) => this.erase(i));
  }

  async erase(i, cb) {
    let tmp = this.state.roots;
    
    if (i !== tmp.length - 1 && i !== 0) {
      tmp[i - 1].next = tmp[i + 1];
      tmp[i + 1].prev = tmp[i - 1];
    } else if (i !== 0) {
      tmp[i - 1].next = {id: 0};
    } else if (i !== tmp.length - 1) {
      tmp[i + 1].prev = {id: 0};
    } else {

    }

    tmp = tmp.filter(n => n.id !== tmp[i].id);

    if (i !== 0) await this.saveNode(tmp[i - 1]);
    if (i !== tmp.length) await this.saveNode(tmp[i]);

    this.setState({roots: tmp}, cb);
    return tmp;
  }


  async indentId(id, node) {
    this.state.roots.map((n, i) => ({...n, i})).filter(n => n.id === id).forEach(({i}) => this.indent(i, node));
  }

  async indent(i, node) {
    if (i === 0) return;
    let tmp = this.state.roots;
    
    if (i !== tmp.length - 1) {
      tmp[i - 1].next = tmp[i + 1];
      tmp[i + 1].prev = tmp[i - 1];
    } else {
      tmp[i - 1].next = {id: 0};
    }

    tmp = tmp.filter(n => n.id !== node.id);

    await this.saveNode(tmp[i - 1]);
    if (i !== tmp.length) await this.saveNode(tmp[i]);

    this.setState({roots: tmp});

    node.parent = tmp[i - 1];
    this.ref[tmp[i - 1].id].insertBack(node);
  }

  focusPrev(id) {
    const tmp = this.state.roots.map((n, i) => ({...n, i})).filter(n => n.id === id);
    if (tmp.length !== 1) return;
    if (tmp[0].i === 0) {
      return;
    } else {
      this.ref[this.state.roots[tmp[0].i - 1].id].focusLast()
    }
  }

  focusLast() {
    if (this.state.roots.length === 0) this.input.focus();
    else this.ref[this.state.roots.slice(-1)[0].id].focusLast();
  }

  focusNext(id) {
    const tmp = this.state.roots.map((n, i) => ({...n, i})).filter(n => n.id === id);
    if (tmp.length !== 1) return;
    if (tmp[0].i === this.state.roots.length - 1) {
      return;
    } else {
      this.ref[this.state.roots[tmp[0].i + 1].id].input.focus();
    }
  }

  checkSwap() {
    const active = this.state.roots.map((a, i) => ({...a, i})).filter(c => this.ref[c.id].state.selected);
    if (active.length !== 2) return;
    this.swap(active[0].i, active[1].i);
    active.forEach(c => this.ref[c.id].setState({selected: false}));
  }

  async swap(i, j) {
    if (i > j) {
      j = [i, i = j][0];
    }
    const oldI = this.state.roots[i];
    const oldJ = this.state.roots[j];
    this.erase(j, () => {
      this.erase(i, () => {
        this.insert(i - 1, oldJ, () => {
          this.insert(j - 1, oldI);
        })
      });
    });
  }




  render() {
    return (
      <div className="App">
        <ul>
          {this.state.roots.map(n => <li><Node key={n.id} ref={(node) => this.ref[n.id] = node} node={n} updateChild={this.updateChild} insertId={this.insertId} indentId={this.indentId} eraseId={this.eraseId} focusPrev={this.focusPrev} focusNext={this.focusNext} swap={this.swap} checkSwap={this.checkSwap}/></li>)}
        </ul>
      </div>
    );
  }
}

