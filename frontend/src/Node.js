import './Node.css';
import React from 'react';
import axios from 'axios';

export default class Node extends React.Component {
  state = {
    typing: 0,
    node: {},
    hide: false,
    selected: false
  }

  constructor(props) {
    super(props);
    this.ref = {};

    this.state = {
      typing: 0,
      node: props.node,
      hide: false,
      selected: false
    };

    this.handleChange = this.handleChange.bind(this);
    this.save = this.save.bind(this);
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

  async saveWithoutInfo(node) {
    const {info} = (await axios.get(`${process.env.REACT_APP_BACKEND_URL}/node?id=${node.id}`)).data;
    await this.saveNode({...node, info});
    return info;
  }

  save() {
    this.saveNode(this.state.node);
  }

  async saveText(text) {
    const newNode = {...this.state.node, info: text};
    await this.saveNode(newNode);
    this.props.updateChild(this.state.node.id, newNode)
    // this.setState({node: {...this.state.node, info: text}}, this.save);
  }

  updateChild(id, child, cb) {
    const node = this.state.node;
    this.state.node.children.map((n, i) => ({...n, i})).filter(n => n.id === id).forEach(({i}) => node.children[i] = child);
    this.props.updateChild(node.id, node, cb);
  }

  async handleChange(event) {
    this.setState({node: {...this.state.node, info: event.target.value}});
    if (this.state.typing) {
      clearTimeout(this.state.typing);
    }
    this.setState({
      typing: setTimeout(() => {
        this.saveText(event.target.value);
      }, 200)
    })
  }

  async createBelow() {
    const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/create`, {info: "", parent: this.state.node.parent.id, prev: 0, next: 0});
    const newNode = {...res.data, children: [], parent: this.state.node.parent};

    this.props.insertId(this.state.node.id, newNode);
  }

  async insertId(id, node) {
    this.state.node.children.map((n, i) => ({...n, i})).filter(n => n.id === id).forEach(({i}) => this.insert(i, node));
  }

  async insertBack(node) {
    this.insert(this.state.node.children.length - 1, node);
  }

  async insert(i, node, cb) {
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
    if (i !== -1) await this.saveNode(tmp.children[i]);
    await this.saveNode(tmp.children[i + 1]);
    if (i !== tmp.children.length - 2) await this.saveNode(tmp.children[i + 2]);

    this.setState({node: tmp}, () => this.ref[node.id].input.focus());

    this.props.updateChild(this.state.node.id, tmp, cb);
  }

  async eraseId(id) {
    this.state.node.children.map((n, i) => ({...n, i})).filter(n => n.id === id).forEach(({i}) => this.erase(i));
  }

  async erase(i, cb) {
    let tmp = this.state.node;
    console.log(tmp);
    
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

    if (i !== 0) await this.saveNode(tmp.children[i - 1]);
    if (i !== tmp.children.length) await this.saveNode(tmp.children[i]);

    this.props.updateChild(this.state.node.id, tmp, cb);
    return tmp;
  }


  async indentId(id, node) {
    this.state.node.children.map((n, i) => ({...n, i})).filter(n => n.id === id).forEach(({i}) => this.indent(i, node));
  }

  async indent(i, node) {
    if (i === 0) return;
    const tmp = await this.erase(i);
    node.parent = tmp.children[i - 1];
    this.ref[tmp.children[i - 1].id].insertBack(node);
  }

  async unindentId(id, node) {
    this.state.node.children.map((n, i) => ({...n, i})).filter(n => n.id === id).forEach(({i}) => this.unindent(i, node));
  }

  async unindent(i, node) {
    await this.erase(i);
    node.parent = this.state.node.parent;
    this.props.insertId(this.state.node.id, node);
  }

  async delete() {
    this.props.focusPrev(this.state.node.id);
    this.props.eraseId(this.state.node.id, this.state.node);
    await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/delete?id=${this.state.node.id}`);
  }

  focusPrev(id) {
    const tmp = this.state.node.children.map((n, i) => ({...n, i})).filter(n => n.id === id);
    if (tmp.length !== 1) return;
    if (tmp[0].i === 0) {
      this.input.focus();
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
      this.props.focusNext(this.state.node.id)
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
    const oldI = this.state.node.children[i];
    const oldJ = this.state.node.children[j];
    this.erase(j, () => {
      this.erase(i, () => {
        this.insert(i - 1, oldJ, () => {
          this.insert(j - 1, oldI);
        })
      });
    });
  }

  handleKey(event) {
    if (event.key === "Click") {
      console.log(event);
    }
    if (event.key === "Tab") {
      event.preventDefault();
      if (event.shiftKey) {
        if (this.state.node.parent.id === 0) return;
        this.props.unindentId(this.state.node.id, this.state.node);
        return;
      }
      this.props.indentId(this.state.node.id, this.state.node);
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
      this.props.focusPrev(this.state.node.id);
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (this.state.node.children.length !== 0) {
        this.ref[this.state.node.children[0].id].input.focus();
        return;
      }
      this.props.focusNext(this.state.node.id);

    }
  }

  toggleHide(event) {
    if (!event.target.classList.contains("bullet")) return;

    event.stopPropagation();

    if (event.shiftKey) {
      this.setState({selected: !this.state.selected}, () => this.props.checkSwap());
    } else this.setState({hide: !this.state.hide});
  }

  componentWillReceiveProps(props) {
    const {node} = props;
    this.setState({node});
  }

  render() {
    return (
      <div className="Node">
        {/* <p contentEditable="true" onKeyDown={this.handleKey} onInput={this.handleChange} ref={this.pRef}>{this.state.node.info}</p> */}
        <div class="inputForm"> 
          <span ref={(s) => this.span = s} class={`bullet ${this.state.hide ? "hidden" : ""} ${this.state.selected ? "selected" : ""}`} onClick={this.toggleHide}> &#8226;</span> 
          <input id={this.state.node.id} ref={(i) => this.input = i}  type="text" value={this.state.node.info} onChange={this.handleChange} onKeyDown={this.handleKey}/>
        </div>
        <div className="children">
          <ul>
          {this.state.hide ? null : 
            this.state.node.children.map(node => 
              <li onClick={this.toggleHide} id={node.id}><Node ref={(i) => this.ref[node.id] = i} node={node} insertId={this.insertId} updateChild={this.updateChild} indentId={this.indentId} insertBack={this.insertBack} unindentId={this.unindentId} eraseId={this.eraseId} focusPrev={this.focusPrev} focusNext={this.focusNext} swap={this.swap} checkSwap={this.checkSwap}/></li>)
          }
          </ul>
        </div>
      </div>
    )
  }
}

