import ArchNode from './ArchNode';
import FlowNode from './FlowNode';
import ERDNode from './ERDNode';
import ClassNode from './ClassNode';
import ComponentNode from './ComponentNode';
import ActivityNode from './ActivityNode';
import GroupNode from './GroupNode';
import type { NodeTypes } from 'reactflow';

export const nodeTypes: NodeTypes = {
  archNode:      ArchNode,
  flowNode:      FlowNode,
  erdNode:       ERDNode,
  classNode:     ClassNode,
  componentNode: ComponentNode,
  activityNode:  ActivityNode,
  groupNode:     GroupNode,
};

export { ArchNode, FlowNode, ERDNode, ClassNode, ComponentNode, ActivityNode, GroupNode };
