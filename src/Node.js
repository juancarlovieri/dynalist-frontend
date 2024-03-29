import './Node.css';

function Node({node}) {
  return (
    <div className="Node">
      <p>{node.info}</p>
      <div className="children">
        {node.children?.map(node => 
          <Node node={node} />
        )}
      </div>
    </div>
  )
}

export default Node;
