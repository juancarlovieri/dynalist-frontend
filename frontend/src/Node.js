import './Node.css';
import React from 'react';
import axios from 'axios';

export default class Node extends React.Component {
  state = {
    typing: 0,
    node: {},
    hide: false,
    selected: false,
    lock: false
  }

  constructor(props) {
    super(props);
    this.ref = {};

    this.state = {
      typing: 0,
      node: props.node,
      hide: false,
      selected: false,
      lock: false
    };

    this.handleChange = this.handleChange.bind(this);
    this.saveText = this.saveText.bind(this);
    this.createBelow = this.createBelow.bind(this);
    this.insertId = this.insertId.bind(this);
    this.insert = this.insert.bind(this);
    this.handleKey = this.handleKey.bind(this);
    this.saveNode = this.saveNode.bind(this);
    this.updateChild = this.updateChild.bind(this);
    this.insertBack = this.insertBack.bind(this);
    this.indentId = this.indentId.bind(this);
    this.indent = this.indent.bind(this);
    this.erase = this.erase.bind(this);
    this.unindentId = this.unindentId.bind(this);
    this.unindent = this.unindent.bind(this);
    this.delete = this.delete.bind(this);
    this.eraseId = this.eraseId.bind(this);
    this.focusPrev = this.focusPrev.bind(this);
    this.focusNext = this.focusNext.bind(this);
    this.focusLast = this.focusLast.bind(this);
    this.toggleHide = this.toggleHide.bind(this);
    this.swap = this.swap.bind(this);
    this.checkSwap = this.checkSwap.bind(this);
    this.saveState = this.saveState.bind(this);
    this.fn = (({insertId, updateChild, indentId, insertBack, unindentId, eraseId, focusPrev, focusNext, swap, checkSwap, saveState}) => 
      ({insertId, updateChild, indentId, insertBack, unindentId, eraseId, focusPrev, focusNext, swap, checkSwap, saveState}))(this);
  }

  saveState() {
    return {
      ...this.state.node, 
      children: this.state.node.children.map(({id}) => this.ref[id].saveState())
    }
  }

  async saveNode(node, text) {
    const converted = {
      info: text,
      parent: node.parent.id,
      prev: node.prev.id,
      next: node.next.id
    };
    await axios.put(`${process.env.REACT_APP_BACKEND_URL}/update?id=${node.id}`, converted)
  }

  async saveInfo(node, text) {
    const converted = {
      info: text
    };
    await axios.put(`${process.env.REACT_APP_BACKEND_URL}/update/info?id=${node.id}`, converted)
  }

  async saveText(text) {
    if (this.state.node.id === 0) return;

    const newNode = {...this.state.node, info: text};
    this.setState({node: newNode}, () => this.saveInfo(newNode, text));
  }

  updateChild(id, child, cb) {
    const node = this.state.node;
    this.state.node.children.map((n, i) => ({...n, i})).filter(n => n.id === id).forEach(({i}) => node.children[i] = child);
    this.setState({node}, cb);
  }

  async handleChange(event) {
    this.setState({node: {...this.state.node, info: event.target.value}});
    if (this.state.typing) {
      clearTimeout(this.state.typing);
    }
    this.setState({
      typing: setTimeout(() => {
        this.saveText(event.target.value);
      }, 500)
    })
  }

  async createBelow() {
    if (this.state.node.id === 0) return;
    const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/create`, {info: "", parent: this.state.node.parent.id, prev: 0, next: 0});
    const newNode = {...res.data, children: [], parent: this.state.node.parent};

    this.props.fn.insertId(this.state.node.id, newNode);
  }

  async insertId(id, node) {
    this.state.node.children.map((n, i) => ({...n, i})).filter(n => n.id === id).forEach(({i}) => this.insert(i, node));
  }

  async insertBack(node) {
    this.insert(this.state.node.children.length - 1, node);
  }

  async insert(i, node, cb) {
    if (this.state.lock) {
      setTimeout(() => this.insert(i, node, cb), 50);
      return;
    } else {
      this.setState({lock: true});
    }
    let tmp = this.state.node;
    if (i !== -1) {
      tmp.children[i].next = node;
      node.prev = tmp.children[i];
    } else {
      node.prev = {id: 0};
    }

    if (i !== tmp.children.length - 1) {
      tmp.children[i + 1].prev = node;
      node.next = tmp.children[i + 1];
    } else {
      node.next = {id: 0};
    }

    tmp.children.splice(i + 1, 0, node);
    if (i !== -1) await this.saveNode(tmp.children[i], this.ref[tmp.children[i].id].state.node.info);
    await this.saveNode(tmp.children[i + 1], node.info);
    if (i !== tmp.children.length - 2) await this.saveNode(tmp.children[i + 2], this.ref[tmp.children[i + 2].id].state.node.info);

    this.setState({node: tmp, lock: false}, () => {
      this.ref[node.id].input.focus()
      if (typeof(cb) === "function") cb();
    });
  }

  async eraseId(id) {
    this.state.node.children.map((n, i) => ({...n, i})).filter(n => n.id === id).forEach(({i}) => this.erase(i));
  }

  async erase(i, cb) {
    if (this.state.lock) {
      setTimeout(() => this.erase(i, cb), 50);
      return;
    } else {
      this.setState({lock: true});
    }
    let tmp = this.state.node;
    
    if (i !== tmp.children.length - 1 && i !== 0) {
      tmp.children[i - 1].next = tmp.children[i + 1];
      tmp.children[i + 1].prev = tmp.children[i - 1];
    } else if (i !== 0) {
      tmp.children[i - 1].next = {id: 0};
    } else if (i !== tmp.children.length - 1) {
      tmp.children[i + 1].prev = {id: 0};
    } else {

    }

    tmp.children = tmp.children.filter(n => n.id !== tmp.children[i].id);

    if (i !== 0) await this.saveNode(tmp.children[i - 1], this.ref[tmp.children[i - 1].id].state.node.info);
    if (i !== tmp.children.length) await this.saveNode(tmp.children[i], this.ref[tmp.children[i].id].state.node.info);

    this.setState({node: tmp, lock: false}, cb);
    return tmp;
  }


  async indentId(id, node) {
    this.state.node.children.map((n, i) => ({...n, i})).filter(n => n.id === id).forEach(({i}) => this.indent(i, node));
  }

  async indent(i, node) {
    if (this.state.lock) {
      setTimeout(() => this.indent(i, node), 50);
      return;
    }
    if (i === 0) return;
    const tmp = await this.erase(i);
    node.parent = tmp.children[i - 1];
    this.ref[tmp.children[i - 1].id].insertBack(node);
  }

  async unindentId(id, node) {
    if (this.state.node.id === 0) return;
    this.state.node.children.map((n, i) => ({...n, i})).filter(n => n.id === id).forEach(({i}) => this.unindent(i, node));
  }

  async unindent(i, node) {
    if (this.state.lock) {
      setTimeout(() => this.unindent(i, node), 50);
      return;
    }
    if (this.state.node.id === 0) return;
    await this.erase(i);
    node.parent = this.state.node.parent;
    this.props.fn.insertId(this.state.node.id, node);
  }

  async delete() {
    if (this.state.node.id === 0) return;
    this.props.fn.focusPrev(this.state.node.id);
    this.props.fn.eraseId(this.state.node.id, this.state.node);
    await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/delete?id=${this.state.node.id}`);
  }

  focusPrev(id) {
    const tmp = this.state.node.children.map((n, i) => ({...n, i})).filter(n => n.id === id);
    if (tmp.length !== 1) return;
    if (tmp[0].i === 0) {
      if (this.state.node.id !== 0) this.input.focus();
      else return;
    } else {
      this.ref[this.state.node.children[tmp[0].i - 1].id].focusLast()
    }
  }

  focusLast() {
    if (this.state.node.children.length === 0) this.input.focus();
    else this.ref[this.state.node.children.slice(-1)[0].id].focusLast();
  }
 
  focusNext(id) {
    const tmp = this.state.node.children.map((n, i) => ({...n, i})).filter(n => n.id === id);
    if (tmp.length !== 1) return;
    if (tmp[0].i === this.state.node.children.length - 1) {
      if (this.state.node.id !== 0) this.props.fn.focusNext(this.state.node.id);
      else return;
    } else {
      this.ref[this.state.node.children[tmp[0].i + 1].id].input.focus();
    }
  }

  checkSwap() {
    const active = this.state.node.children.map((a, i) => ({...a, i})).filter(c => this.ref[c.id].state.selected);
    if (active.length !== 2) return;
    this.swap(active[0].i, active[1].i);
    active.forEach(c => this.ref[c.id].setState({selected: false}));
  }

  async swap(i, j) {
    if (i > j) {
      j = [i, i = j][0];
    }
    let oldI = this.state.node.children[i];
    oldI = this.ref[oldI.id].saveState();
    let oldJ = this.state.node.children[j];
    oldJ = this.ref[oldJ.id].saveState();
    this.erase(j, () => {
      this.erase(i, () => {
        this.insert(i - 1, oldJ, () => {
          this.insert(j - 1, oldI);
        })
      });
    });
  }

  handleKey(event) {
    if (this.state.node.id === 0) return;
    if (event.key === "Tab") {
      event.preventDefault();
      if (event.shiftKey) {
        if (this.state.node.parent.id === 0) return;
        this.props.fn.unindentId(this.state.node.id, this.saveState());
        return;
      }
      this.props.fn.indentId(this.state.node.id, this.saveState());
    }
    if (event.key === "Enter") {
      event.preventDefault();
      this.createBelow();
    }
    if (event.key === "Backspace") {
      if (event.target.value === "") {
        event.preventDefault();
        this.delete();
      }
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      this.props.fn.focusPrev(this.state.node.id);
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (this.state.node.children.length !== 0) {
        this.ref[this.state.node.children[0].id].input.focus();
        return;
      }
      this.props.fn.focusNext(this.state.node.id);

    }
  }

  toggleHide(event) {
    if (!event.target.classList.contains("bullet")) return;
    if (this.state.node.id === 0) return;

    event.stopPropagation();

    if (event.shiftKey) {
      this.setState({selected: !this.state.selected}, () => this.props.fn.checkSwap());
    } else this.setState({hide: !this.state.hide});
  }

  componentWillReceiveProps(props) {
    const {node} = props;
    this.setState({node: {...node, info: this.state.node.info, children: this.state.node.children}});
  }

  render() {
    return (
      <div className="Node">
        {/* <p contentEditable="true" onKeyDown={this.handleKey} onInput={this.handleChange} ref={this.pRef}>{this.state.node.info}</p> */}
        {
          this.state.node.id !== 0 ? 
            <div class="inputForm"> 
              <span ref={(s) => this.span = s} class={`bullet ${this.state.hide ? "hidden" : ""} ${this.state.selected ? "selected" : ""}`} onClick={this.toggleHide}> &#8226;</span> 
              <input id={this.state.node.id} ref={(i) => this.input = i}  type="text" value={this.state.node.info} onChange={this.handleChange} onKeyDown={this.handleKey}/>
            </div> 
          : null
        }
        <div className="children">
          <ul>
          {this.state.hide ? null : 
            this.state.node.children.map(node => 
              <li onClick={this.toggleHide} id={node.id}><Node key={node.id} ref={(i) => this.ref[node.id] = i} node={node} fn={this.fn} /></li>)
          }
          </ul>
        </div>
      </div>
    )
  }
}

