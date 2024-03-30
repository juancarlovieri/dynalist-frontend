import './Node.css';
import React from 'react';
import axios from 'axios';

export default class Node extends React.Component {
  state = {
    typing: 0,
    node: {},
  }

  constructor(props) {
    super(props);
    this.ref = {};

    this.state = {
      typing: 0,
      node: props.node
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

  async insert(i, node) {
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

    this.props.updateChild(this.state.node.id, tmp);
  }


  async indentId(id, node) {
    this.state.node.children.map((n, i) => ({...n, i})).filter(n => n.id === id).forEach(({i}) => this.indent(i, node));
  }

  async indent(i, node) {
    if (i === 0) return;
    let tmp = this.state.node;
    
    if (i !== tmp.children.length - 1) {
      tmp.children[i - 1].next = tmp.children[i + 1];
      tmp.children[i + 1].prev = tmp.children[i - 1];
    } else {
      tmp.children[i - 1].next = {id: 0};
    }

    tmp.children = tmp.children.filter(n => n.id !== node.id);

    await this.saveNode(tmp.children[i - 1]);
    if (i !== tmp.children.length) await this.saveNode(tmp.children[i]);

    this.props.updateChild(this.state.node.id, tmp);

    node.parent = tmp.children[i - 1];
    this.ref[tmp.children[i - 1].id].insertBack(node);
  }

  handleKey(event) {
    if (event.key === "Tab") {
      event.preventDefault();
      this.props.indentId(this.state.node.id, this.state.node);
    }
    if (event.key === "Enter") {
      event.preventDefault();
      this.createBelow();
    }
  }

  componentWillReceiveProps(props) {
    const {node} = props;
    this.setState({node});
  }

  render() {
    return (
      <div className="Node">
        {/* <p contentEditable="true" onKeyDown={this.handleKey} onInput={this.handleChange} ref={this.pRef}>{this.state.node.info}</p> */}
        <input ref={(i) => this.input = i} type="text" value={this.state.node.info} onChange={this.handleChange} onKeyDown={this.handleKey}/>
        <div className="children">
          <ul>
          {
            this.state.node.children.map(node => 
              <li><Node ref={(i) => this.ref[node.id] = i} node={node} insertId={this.insertId} updateChild={this.updateChild} indentId={this.indentId} insertBack={this.insertBack} /></li>)
          }
          </ul>
        </div>
      </div>
    )
  }
}

