import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Edit3, 
  Plus, 
  Trash2, 
  Save, 
  X, 
  GripVertical,
  AlertTriangle,
  Copy,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { MenuItem } from '../types';
import IconRenderer from './IconRenderer';
import { getRoutesByCategory } from '../data/routeConfig';
import { RouteArgsManager } from '../utils/routeArgsManager';
import RouteArgsConfig from './RouteArgsConfig';
import RouteArgsEditor from './RouteArgsEditor';
import AssetsManager from './AssetsManager';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';

interface TreeNode {
  id: string;
  data: MenuItem;
  children: TreeNode[];
  level: number;
  type: 'menu' | 'submenu';
}

interface DragState {
  isDragging: boolean;
  draggedNode: TreeNode | null;
  draggedNodeParent: TreeNode[] | null;
  draggedNodeIndex: number;
  dragOverNode: string | null;
  dragOverPosition: 'before' | 'after' | 'inside' | null;
}

interface MenuEditorProps {
  items: MenuItem[];
  onSave: (items: MenuItem[]) => void;
  onClose: () => void;
  authSeed?: string;
}

export default function MenuEditor({ items, onSave, onClose, authSeed = '' }: MenuEditorProps) {
  const [menuTree, setMenuTree] = useState<TreeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set()); // Start with all collapsed
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingNodeData, setEditingNodeData] = useState<MenuItem | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [showAddChoice, setShowAddChoice] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [menuItemColors, setMenuItemColors] = useState<string[]>([]);
  
  // Drag and drop state
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedNode: null,
    draggedNodeParent: null,
    draggedNodeIndex: -1,
    dragOverNode: null,
    dragOverPosition: null
  });

  const dragRef = useRef<HTMLDivElement>(null);
  
  // Warning message state
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Unsaved changes tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'close' | 'cancel' | null>(null);
  const originalItemsRef = useRef<MenuItem[]>(items);

  // Edit modal unsaved changes tracking
  const [editModalHasChanges, setEditModalHasChanges] = useState(false);
  const [showEditModalUnsavedDialog, setShowEditModalUnsavedDialog] = useState(false);
  const originalEditDataRef = useRef<MenuItem | null>(null);

  // Asset picker/uploader state
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [assetsRefreshTrigger, setAssetsRefreshTrigger] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate random colors for menu items
  useEffect(() => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
    ];
    
    const shuffledColors = [...colors].sort(() => Math.random() - 0.5);
    setMenuItemColors(shuffledColors);
  }, []);

  // Build tree structure from flat items
  const buildTree = (items: MenuItem[], parentId?: string): TreeNode[] => {
    const tree: TreeNode[] = [];
    
    items.forEach((item, index) => {
      const nodeId = parentId ? `${parentId}_${index}` : `root_${index}`;
      
      const node: TreeNode = {
        id: nodeId,
        data: { ...item },
        children: [],
        level: parentId ? (parentId.split('_').length - 1) : 0,
        type: item.submenu ? 'submenu' : 'menu'
      };
      
      if (item.submenu?.items) {
        node.children = buildTree(item.submenu.items, nodeId);
      }
      
      tree.push(node);
    });
    
    return tree;
  };

  // Convert tree back to flat structure
  const treeToFlat = (tree: TreeNode[]): MenuItem[] => {
    const result: MenuItem[] = [];
    
    const processNode = (node: TreeNode) => {
      const item: MenuItem = { ...node.data };
      
      if (node.children.length > 0) {
        item.submenu = {
          id: node.data.submenu?.id || `submenu_${node.id}`,
          submenuTitle: node.data.submenu?.submenuTitle || node.data.submenuTitle || 'Submenu',
          submenuStyle: node.data.submenu?.submenuStyle || node.data.submenuStyle || 'fullScreen',
          submenuLayout: node.data.submenu?.submenuLayout || node.data.submenuLayout || 'grid',
          items: treeToFlat(node.children)
        };
      }
      
      result.push(item);
    };
    
    tree.forEach(processNode);
    return result;
  };

  // Generate menu ID based on title
  const generateMenuId = (title: string, existingIds: string[] = []) => {
    // Clean the title: remove special characters, convert to lowercase, replace spaces with underscores
    const cleanTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters except spaces
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .trim();
    
    // Base ID format: menu_{clean_title}
    const baseId = `menu_${cleanTitle}`;
    
    // Check if this ID already exists
    const existingBaseIds = existingIds.filter(id => id.startsWith(baseId));
    
    if (existingBaseIds.length === 0) {
      return baseId;
    }
    
    // If exists, add a number suffix
    const numbers = existingBaseIds.map(id => {
      const match = id.match(/_(\d+)$/);
      return match ? parseInt(match[1]) : 0;
    });
    
    const nextNumber = Math.max(...numbers) + 1;
    return `${baseId}_${nextNumber}`;
  };

  // Drag and drop event handlers
  const handleDragStart = (e: React.DragEvent, node: TreeNode) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', node.id);
    
    const { parent, index } = findNodeAndParent(menuTree, node.id);
    
    console.log('Drag start:', {
      nodeId: node.id,
      nodeLevel: node.level,
      nodeTitle: node.data.title,
      parentFound: !!parent,
      parentIndex: index,
      parentIsRoot: parent === menuTree
    });
    
    setDragState({
      isDragging: true,
      draggedNode: node,
      draggedNodeParent: parent,
      draggedNodeIndex: index,
      dragOverNode: null,
      dragOverPosition: null
    });
  };

  const handleDragOver = (e: React.DragEvent, node: TreeNode) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (!dragState.isDragging || dragState.draggedNode?.id === node.id) return;
    
    // Simple validation: only prevent dropping into itself
    if (node.id === dragState.draggedNode!.id) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    
    // Calculate drop position based on mouse position
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    
    let position: 'before' | 'after' | 'inside' = 'after';
    
    if (y < height * 0.25) {
      position = 'before';
    } else if (y > height * 0.75) {
      position = 'after';
    } else {
      position = 'inside';
    }
    
    // Set the drag state
    setDragState(prev => ({
      ...prev,
      dragOverNode: node.id,
      dragOverPosition: position
    }));
  };

  const handleDrop = (e: React.DragEvent, targetNode: TreeNode) => {
    e.preventDefault();
    
    if (!dragState.isDragging || !dragState.draggedNode || !dragState.draggedNodeParent) return;
    
    const { draggedNode, draggedNodeParent, dragOverPosition } = dragState;
    
    if (!dragOverPosition) return;
    
    // Simple validation: only prevent dropping into itself
    if (targetNode.id === draggedNode.id) {
      return;
    }
    
    // Create a deep copy of the tree
    const deepCloneTree = (tree: TreeNode[]): TreeNode[] => {
      return tree.map(node => ({
        ...node,
        children: deepCloneTree(node.children)
      }));
    };
    
    let updatedTree = deepCloneTree(menuTree);
    
    // First, remove the dragged node from its original position
    const removeNodeFromTree = (tree: TreeNode[], nodeId: string): boolean => {
      for (let i = 0; i < tree.length; i++) {
        if (tree[i].id === nodeId) {
          tree.splice(i, 1);
          return true;
        }
        if (removeNodeFromTree(tree[i].children, nodeId)) {
          return true;
        }
      }
      return false;
    };
    
    // Remove the dragged node
    removeNodeFromTree(updatedTree, draggedNode.id);
    
    if (dragOverPosition === 'inside') {
      // Insert as child of target node
      const insertAsChild = (tree: TreeNode[], targetId: string, nodeToInsert: TreeNode): boolean => {
        for (let i = 0; i < tree.length; i++) {
          if (tree[i].id === targetId) {
            const newLevel = targetNode.level + 1;
            const updatedNode = {
              ...nodeToInsert,
              level: newLevel,
              children: nodeToInsert.children.map(child => ({
                ...child,
                level: newLevel + 1
              }))
            };
            tree[i].children = [updatedNode, ...tree[i].children];
            return true;
          }
          if (insertAsChild(tree[i].children, targetId, nodeToInsert)) {
            return true;
          }
        }
        return false;
      };
      
      insertAsChild(updatedTree, targetNode.id, draggedNode);
    } else {
      // Insert before or after target node at the same level (reordering)
      const targetLevel = targetNode.level;
      
      // Find the parent array that contains the target node
      const findParentArray = (tree: TreeNode[], targetId: string): TreeNode[] | null => {
        // First check if the target is at the root level
        if (tree.some(node => node.id === targetId)) {
          return tree;
        }
        
        // Then search through all children recursively
        for (const node of tree) {
          if (node.children.some(child => child.id === targetId)) {
            return node.children;
          }
          
          // Search deeper in the tree
          const found = findParentArray(node.children, targetId);
          if (found) return found;
        }
        
        return null;
      };
      
      const parentArray = findParentArray(updatedTree, targetNode.id);
      
      if (parentArray) {
        // Find the target index in the parent array
        const targetIndex = parentArray.findIndex(node => node.id === targetNode.id);
        
        if (targetIndex !== -1) {
          const insertIndex = dragOverPosition === 'before' ? targetIndex : targetIndex + 1;
          
          // Update the dragged node and all its children to the target level
          const updateLevels = (node: TreeNode, newLevel: number): TreeNode => ({
            ...node,
            level: newLevel,
            children: node.children.map(child => updateLevels(child, newLevel + 1))
          });
          
          const updatedNode = updateLevels(draggedNode, targetLevel);
          
          // Insert at the calculated position for reordering
          parentArray.splice(insertIndex, 0, updatedNode);
        }
      } else {
        // If we can't find the parent, insert at root level
        const updatedNode = {
          ...draggedNode,
          level: 0,
          children: draggedNode.children.map(child => ({
            ...child,
            level: 1
          }))
        };
        updatedTree.push(updatedNode);
      }
    }
    
    // Update the tree
    setMenuTree(updatedTree);
    
    // Reset drag state
    setDragState({
      isDragging: false,
      draggedNode: null,
      draggedNodeParent: null,
      draggedNodeIndex: -1,
      dragOverNode: null,
      dragOverPosition: null
    });
  };

  const handleDragEnd = () => {
    setDragState({
      isDragging: false,
      draggedNode: null,
      draggedNodeParent: null,
      draggedNodeIndex: -1,
      dragOverNode: null,
      dragOverPosition: null
    });
  };

  useEffect(() => {
    // Process items to ensure backward compatibility with auto-generated IDs
    const processedItems = processItemsForBackwardCompatibility(items);
    setMenuTree(buildTree(processedItems));
  }, [items]);

  // Process items to ensure backward compatibility
  const processItemsForBackwardCompatibility = (items: MenuItem[]): MenuItem[] => {
    const processedItems: MenuItem[] = [];
    const existingIds: string[] = [];
    let generatedCount = 0;
    
    const processItem = (item: MenuItem): MenuItem => {
      const processedItem = { ...item };
      
      // Generate menu_id if missing
      if (!processedItem.menu_id && processedItem.title) {
        processedItem.menu_id = generateMenuId(processedItem.title, existingIds);
        existingIds.push(processedItem.menu_id);
        generatedCount++;
        console.log(`Generated menu ID for "${processedItem.title}": ${processedItem.menu_id}`);
      } else if (processedItem.menu_id) {
        existingIds.push(processedItem.menu_id);
      }
      
      // Process submenu items if they exist
      if (processedItem.submenu?.items) {
        processedItem.submenu = {
          ...processedItem.submenu,
          items: processedItem.submenu.items.map(processItem)
        };
      }
      
      return processedItem;
    };
    
    const result = items.map(processItem);
    
    if (generatedCount > 0) {
      console.log(`Backward compatibility: Generated ${generatedCount} menu IDs for existing items`);
    }
    
    return result;
  };

  const toggleNodeExpansion = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const addMenuItem = () => {
    setShowAddChoice(true);
  };

  const createNewMenuItem = (type: 'menu' | 'submenu') => {
    if (type === 'menu') {
      const title = 'Item Menu Baru';
      const getAllMenuIds = (tree: TreeNode[]): string[] => {
        const ids: string[] = [];
        tree.forEach(node => {
          if (node.data.menu_id) ids.push(node.data.menu_id);
          ids.push(...getAllMenuIds(node.children));
        });
        return ids;
      };
      const existingIds = getAllMenuIds(menuTree);
      const menuId = generateMenuId(title, existingIds);
      
      const newNode: TreeNode = {
        id: `new_${Date.now()}`,
        data: {
          menu_id: menuId,
          iconUrl: '📱',
          title: title,
          textSize: 11.0,
          route: '/product',
          routeArgs: {
            operators: ['TSELREG'],
            hintText: 'Nomor HP Pelanggan'
          }
        },
        children: [],
        level: 0,
        type: 'menu'
      };
      
      setMenuTree([...menuTree, newNode]);
    } else {
      const title = 'Submenu Baru';
      const getAllMenuIds = (tree: TreeNode[]): string[] => {
        const ids: string[] = [];
        tree.forEach(node => {
          if (node.data.menu_id) ids.push(node.data.menu_id);
          ids.push(...getAllMenuIds(node.children));
        });
        return ids;
      };
      const existingIds = getAllMenuIds(menuTree);
      const menuId = generateMenuId(title, existingIds);
      
      const newNode: TreeNode = {
        id: `new_${Date.now()}`,
        data: {
          menu_id: menuId,
          iconUrl: '📱',
          title: title,
          textSize: 11.0,
          submenu: {
            id: `submenu_${Date.now()}`,
            submenuTitle: 'Submenu Baru',
            submenuStyle: 'fullScreen',
            submenuLayout: 'grid',
            items: []
          },
          submenuTitle: 'Submenu Baru',
          submenuStyle: 'fullScreen',
          submenuLayout: 'grid'
        },
        children: [],
        level: 0,
        type: 'submenu'
      };
      
      setMenuTree([...menuTree, newNode]);
    }
    
    setShowAddChoice(false);
  };

  const createNewItemInBranch = (type: 'menu' | 'submenu', parentId: string) => {
    const parentNode = findNodeById(menuTree, parentId);
    if (!parentNode) return;

    // Only allow adding to items that are already submenus
    if (!parentNode.data.submenu) {
      alert('Hanya item submenu yang dapat memiliki submenu. Silakan ubah item ini menjadi submenu terlebih dahulu.');
      return;
    }

    // Ensure parent submenu is expanded
    if (!expandedNodes.has(parentId)) {
      setExpandedNodes(prev => new Set([...prev, parentId]));
    }

    if (type === 'menu') {
      const title = 'Item Menu Baru';
      const getAllMenuIds = (tree: TreeNode[]): string[] => {
        const ids: string[] = [];
        tree.forEach(node => {
          if (node.data.menu_id) ids.push(node.data.menu_id);
          ids.push(...getAllMenuIds(node.children));
        });
        return ids;
      };
      const existingIds = getAllMenuIds(menuTree);
      const menuId = generateMenuId(title, existingIds);
      
      const newMenuItem: MenuItem = {
        menu_id: menuId,
        iconUrl: '📱',
        title: title,
        textSize: 11.0,
        route: '/product',
        routeArgs: {
          operators: ['TSELREG'],
          hintText: 'Nomor HP Pelanggan'
        }
      };

      const newTreeNode: TreeNode = {
        id: `new_${Date.now()}`,
        data: newMenuItem,
        children: [],
        level: parentNode.level + 1,
        type: 'menu'
      };

      parentNode.children.push(newTreeNode);
    } else {
      const title = 'Submenu Baru';
      const getAllMenuIds = (tree: TreeNode[]): string[] => {
        const ids: string[] = [];
        tree.forEach(node => {
          if (node.data.menu_id) ids.push(node.data.menu_id);
          ids.push(...getAllMenuIds(node.children));
        });
        return ids;
      };
      const existingIds = getAllMenuIds(menuTree);
      const menuId = generateMenuId(title, existingIds);
      
      const newSubmenuItem: MenuItem = {
        menu_id: menuId,
        iconUrl: '📱',
        title: title,
        textSize: 11.0,
        submenu: {
          id: `submenu_${Date.now()}`,
          submenuTitle: 'Submenu Baru',
          submenuStyle: 'fullScreen',
          submenuLayout: 'grid',
          items: []
        },
        submenuTitle: 'Submenu Baru',
        submenuStyle: 'fullScreen',
        submenuLayout: 'grid'
      };

      const newTreeNode: TreeNode = {
        id: `new_${Date.now()}`,
        data: newSubmenuItem,
        children: [],
        level: parentNode.level + 1,
        type: 'submenu'
      };

      parentNode.children.push(newTreeNode);
    }
    
    setMenuTree([...menuTree]);
    setShowAddItemModal(false);
    setSelectedParentId(null);
  };



  const findNode = (tree: TreeNode[], nodeId: string): TreeNode | null => {
    for (const node of tree) {
      if (node.id === nodeId) return node;
      const found = findNode(node.children, nodeId);
      if (found) return found;
    }
    return null;
  };

  const findNodeById = (tree: TreeNode[], nodeId: string): TreeNode | null => {
    for (const node of tree) {
      if (node.id === nodeId) return node;
      const found = findNodeById(node.children, nodeId);
      if (found) return found;
    }
    return null;
  };

  // Drag and drop utility functions
  const findNodeAndParent = (tree: TreeNode[], nodeId: string): { node: TreeNode | null; parent: TreeNode[] | null; index: number } => {
    for (let i = 0; i < tree.length; i++) {
      if (tree[i].id === nodeId) {
        return { node: tree[i], parent: tree, index: i };
      }
      const found = findNodeAndParent(tree[i].children, nodeId);
      if (found.node) return found;
    }
    return { node: null, parent: null, index: -1 };
  };

  const removeNodeFromTree = (tree: TreeNode[], nodeId: string): TreeNode[] => {
    return tree.filter(node => {
      if (node.id === nodeId) return false;
      node.children = removeNodeFromTree(node.children, nodeId);
      return true;
    });
  };

  const insertNodeAtPosition = (
    tree: TreeNode[], 
    targetNodeId: string, 
    position: 'before' | 'after' | 'inside', 
    nodeToInsert: TreeNode
  ): TreeNode[] => {
    return tree.map(node => {
      if (node.id === targetNodeId) {
        if (position === 'inside') {
          return {
            ...node,
            children: [nodeToInsert, ...node.children]
          };
        } else if (position === 'before') {
          // Insert before this node in parent
          return node;
        } else if (position === 'after') {
          // Insert after this node in parent
          return node;
        }
      }
      
      if (node.children.length > 0) {
        node.children = insertNodeAtPosition(node.children, targetNodeId, position, nodeToInsert);
      }
      
      return node;
    });
  };

  const insertNodeInParent = (
    parentTree: TreeNode[], 
    targetNodeId: string, 
    position: 'before' | 'after', 
    nodeToInsert: TreeNode
  ): TreeNode[] => {
    const targetIndex = parentTree.findIndex(node => node.id === targetNodeId);
    if (targetIndex === -1) return parentTree;
    
    const newTree = [...parentTree];
    if (position === 'before') {
      newTree.splice(targetIndex, 0, nodeToInsert);
    } else {
      newTree.splice(targetIndex + 1, 0, nodeToInsert);
    }
    
    return newTree;
  };

  const updateNodeInTree = (tree: TreeNode[], nodeId: string, updater: (node: TreeNode) => TreeNode): TreeNode[] => {
    return tree.map(node => {
      if (node.id === nodeId) {
        return updater(node);
      }
      return {
        ...node,
        children: updateNodeInTree(node.children, nodeId, updater)
      };
    });
  };

  const updateNode = (updates: Partial<MenuItem>) => {
    if (!editingNodeData || !editingNodeId) return;
    
    const updatedData = {
      ...editingNodeData,
      ...updates
    };
    
    // Ensure submenu properties are preserved when updating
    if ((editingNodeData.submenu || editingNodeData.submenuTitle || editingNodeData.submenuStyle || editingNodeData.submenuLayout) && !updatedData.submenu) {
      updatedData.submenu = {
        id: editingNodeData.submenu?.id || `submenu_${editingNodeId}`,
        submenuTitle: editingNodeData.submenu?.submenuTitle || editingNodeData.submenuTitle || editingNodeData.title || 'Submenu',
        submenuStyle: editingNodeData.submenu?.submenuStyle || editingNodeData.submenuStyle || 'fullScreen',
        submenuLayout: editingNodeData.submenu?.submenuLayout || editingNodeData.submenuLayout || 'grid',
        items: editingNodeData.submenu?.items || []
      };
    }
    
    setEditingNodeData(updatedData);
    
    // Check if there are changes in the edit modal
    if (originalEditDataRef.current) {
      const hasChanges = JSON.stringify(updatedData) !== JSON.stringify(originalEditDataRef.current);
      setEditModalHasChanges(hasChanges);
    }
    
    // Also update the tree immediately so changes are saved
    const updatedTree = updateNodeInTree(menuTree, editingNodeId, (node) => ({
      ...node,
      data: updatedData,
      type: updatedData.submenu ? 'submenu' : 'menu'
    }));
    
    setMenuTree(updatedTree);
  };

  const deleteNode = (nodeId: string) => {
    const removeNodeFromTree = (tree: TreeNode[]): TreeNode[] => {
      return tree.filter(node => {
        if (node.id === nodeId) return false;
        node.children = removeNodeFromTree(node.children);
        return true;
      });
    };
    
    setMenuTree(removeNodeFromTree([...menuTree]));
  };

  const duplicateNode = (nodeId: string) => {
    const nodeToDuplicate = findNodeById(menuTree, nodeId);
    if (!nodeToDuplicate) return;

    // Get all existing menu IDs to avoid duplicates
    const getAllMenuIds = (tree: TreeNode[]): string[] => {
      const ids: string[] = [];
      tree.forEach(node => {
        if (node.data.menu_id) ids.push(node.data.menu_id);
        ids.push(...getAllMenuIds(node.children));
      });
      return ids;
    };
    const existingIds = getAllMenuIds(menuTree);

    // Recursively duplicate a node and all its children
    const duplicateNodeRecursive = (node: TreeNode, newParentId?: string): TreeNode => {
      // Generate new menu ID for the duplicated node
      const newTitle = `${node.data.title} (Copy)`;
      const newMenuId = generateMenuId(newTitle, existingIds);
      existingIds.push(newMenuId); // Add to existing IDs to avoid conflicts in children

      // Create new node with updated data
      const duplicatedData: MenuItem = {
        ...node.data,
        menu_id: newMenuId,
        title: newTitle
      };

      // If it's a submenu, also duplicate the submenu structure
      if (node.data.submenu) {
        duplicatedData.submenu = {
          ...node.data.submenu,
          id: `submenu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          submenuTitle: `${node.data.submenu.submenuTitle} (Copy)`,
          items: [] // Will be populated by children
        };
        duplicatedData.submenuTitle = duplicatedData.submenu.submenuTitle;
      }

      // Recursively duplicate children
      const duplicatedChildren = node.children.map(child => 
        duplicateNodeRecursive(child, nodeId)
      );

      return {
        id: `duplicated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        data: duplicatedData,
        children: duplicatedChildren,
        level: node.level,
        type: node.type
      };
    };

    // Create the duplicated node
    const duplicatedNode = duplicateNodeRecursive(nodeToDuplicate);

    // Find the parent of the original node to insert the duplicate after it
    const { parent, index } = findNodeAndParent(menuTree, nodeId);
    
    if (parent) {
      // Insert the duplicated node right after the original
      const newTree = [...menuTree];
      const insertAt = (tree: TreeNode[], targetId: string, nodeToInsert: TreeNode): boolean => {
        for (let i = 0; i < tree.length; i++) {
          if (tree[i].id === targetId) {
            tree.splice(i + 1, 0, nodeToInsert);
            return true;
          }
          if (insertAt(tree[i].children, targetId, nodeToInsert)) {
            return true;
          }
        }
        return false;
      };
      
      insertAt(newTree, nodeId, duplicatedNode);
      setMenuTree(newTree);
    } else {
      // If it's a root node, add to the end
      setMenuTree([...menuTree, duplicatedNode]);
    }
  };

  const openEditModal = (node: TreeNode) => {
    setEditingNodeData({ ...node.data });
    setEditingNodeId(node.id);
    setShowEditModal(true);
    setEditModalHasChanges(false);
    originalEditDataRef.current = { ...node.data };
  };

  const openAddItemModal = (parentId: string) => {
    setSelectedParentId(parentId);
    setShowAddItemModal(true);
  };

  const saveEditModal = () => {
    if (!editingNodeData || !editingNodeId) return;

    // Tree is already updated in updateNode, just close the modal
    setShowEditModal(false);
    setEditingNodeData(null);
    setEditingNodeId(null);
    setEditModalHasChanges(false);
    originalEditDataRef.current = null;
  };

  const closeEditModal = () => {
    if (editModalHasChanges) {
      setShowEditModalUnsavedDialog(true);
    } else {
      setShowEditModal(false);
      setEditingNodeData(null);
      setEditingNodeId(null);
      setEditModalHasChanges(false);
      originalEditDataRef.current = null;
    }
  };

  const confirmEditModalClose = () => {
    // Revert changes by restoring original data
    if (originalEditDataRef.current && editingNodeId) {
      const updatedTree = updateNodeInTree(menuTree, editingNodeId, (node) => ({
        ...node,
        data: originalEditDataRef.current!
      }));
      setMenuTree(updatedTree);
    }
    
    setShowEditModalUnsavedDialog(false);
    setShowEditModal(false);
    setEditingNodeData(null);
    setEditingNodeId(null);
    setEditModalHasChanges(false);
    originalEditDataRef.current = null;
  };

  const cancelEditModalClose = () => {
    setShowEditModalUnsavedDialog(false);
  };

  const getPublicUrl = async (filename: string) => {
    // Strip any leading /assets/ or / from the filename
    const cleanFilename = filename.replace(/^\/assets\//, '').replace(/^\//, '');
    const apiUrl = await getApiUrl('');
    return `${apiUrl}/assets/${cleanFilename}`;
  };

  const handleUploadFile = async (file: File) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        console.error('Session key not found');
        return null;
      }

      const formData = new FormData();
      formData.append('session_key', sessionKey);
      formData.append('auth_seed', authSeed || localStorage.getItem('adminAuthSeed') || '');
      formData.append('file', file);

      const apiUrl = await getApiUrl('/admin/assets/upload');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'X-Token': X_TOKEN_VALUE,
        },
        body: formData,
      });

      const data = await response.json();
      console.log('Upload response:', data);
      
      if (data.success) {
        // Try different response formats
        let filename = null;
        let publicUrl = null;
        
        // Check for filename in various places
        if (data.filename) {
          filename = data.filename;
        } else if (data.asset?.filename) {
          filename = data.asset.filename;
        } else if (data.file_url) {
          // Extract filename from file_url
          const urlParts = data.file_url.split('/');
          filename = urlParts[urlParts.length - 1];
        }
        
        // Check for public_url or file_url (might be full URL or relative)
        if (data.public_url) {
          publicUrl = data.public_url;
        } else if (data.asset?.public_url) {
          publicUrl = data.asset.public_url;
        } else if (data.file_url) {
          publicUrl = data.file_url;
        }
        
        // If we have a URL but it's relative (starts with /), make it absolute
        if (publicUrl && publicUrl.startsWith('/')) {
          const baseUrl = await getApiUrl('');
          publicUrl = `${baseUrl}${publicUrl}`;
        }
        
        // If we still don't have a URL but have a filename, construct it
        if (!publicUrl && filename) {
          publicUrl = await getPublicUrl(filename);
        }
        
        console.log('Extracted filename:', filename);
        console.log('Constructed publicUrl:', publicUrl);
        
        if (publicUrl) {
          setAssetsRefreshTrigger(prev => prev + 1);
          return publicUrl;
        } else {
          console.error('Upload succeeded but no URL found in response:', data);
          return null;
        }
      } else {
        console.error('Upload failed:', data.message || 'Unknown error');
        return null;
      }
    } catch (error) {
      console.error('Upload failed:', error);
      return null;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!editingNodeData || !editingNodeId) {
      console.error('No node data or node ID available for update');
      console.log('editingNodeData:', editingNodeData);
      console.log('editingNodeId:', editingNodeId);
      return;
    }

    console.log('Starting file upload...');
    const url = await handleUploadFile(file);
    console.log('Upload completed, URL:', url);
    
    if (url) {
      console.log('Setting iconUrl to:', url);
      console.log('Current editingNodeData before update:', editingNodeData);
      
      // Update the node - this should update both editingNodeData and the tree
      updateNode({ iconUrl: url });
      
      // Also directly update editingNodeData state to ensure it's reflected immediately
      setEditingNodeData(prev => {
        if (!prev) return prev;
        const updated = { ...prev, iconUrl: url };
        console.log('Directly updating editingNodeData to:', updated);
        return updated;
      });
      
      console.log('updateNode and setEditingNodeData called');
    } else {
      console.error('Failed to get URL from upload');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAssetSelect = async (filename: string) => {
    const url = await getPublicUrl(filename);
    if (url && editingNodeData) {
      updateNode({ iconUrl: url });
    }
    setShowAssetPicker(false);
  };

  // Check if there are unsaved changes
  const checkForUnsavedChanges = () => {
    const currentFlat = treeToFlat(menuTree);
    const originalFlat = originalItemsRef.current;
    
    // Deep comparison of the arrays
    const hasChanges = JSON.stringify(currentFlat) !== JSON.stringify(originalFlat);
    setHasUnsavedChanges(hasChanges);
    return hasChanges;
  };

  // Handle beforeunload event (tab/browser close)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Check for changes whenever menuTree changes
  useEffect(() => {
    checkForUnsavedChanges();
  }, [menuTree]);

  // Handle close with unsaved changes check
  const handleClose = () => {
    if (hasUnsavedChanges) {
      setPendingAction('close');
      setShowUnsavedChangesDialog(true);
    } else {
      onClose();
    }
  };

  // Handle cancel with unsaved changes check
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setPendingAction('cancel');
      setShowUnsavedChangesDialog(true);
    } else {
      onClose();
    }
  };

  // Confirm action (discard changes)
  const confirmAction = () => {
    setShowUnsavedChangesDialog(false);
    setPendingAction(null);
    onClose();
  };

  // Cancel action (stay in editor)
  const cancelAction = () => {
    setShowUnsavedChangesDialog(false);
    setPendingAction(null);
  };

  const saveChanges = () => {
    const flatItems = treeToFlat(menuTree);
    console.log('MenuEditor: Saving changes:', { menuTree, flatItems, onSave: !!onSave });
    
    if (!onSave) {
      console.error('MenuEditor: onSave prop is undefined!');
      return;
    }
    
    onSave(flatItems);
    // Update the original items reference after successful save
    originalItemsRef.current = flatItems;
    setHasUnsavedChanges(false);
  };

  const getMenuItemColor = (index: number) => {
    return menuItemColors[index % menuItemColors.length] || '#E5E7EB';
  };

  const renderNode = (node: TreeNode) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    const isSubmenu = !!node.data.submenu;
    const isDragOver = dragState.dragOverNode === node.id;
    const isDragging = dragState.isDragging && dragState.draggedNode?.id === node.id;
    
    // Simple validation: only prevent dropping into itself
    const isInvalidDropTarget = dragState.isDragging && dragState.draggedNode && node.id === dragState.draggedNode!.id;

    return (
      <div key={node.id} className="mb-1">
        <div 
          className={`flex items-center gap-2 p-3 rounded-lg border transition-all duration-200 select-none cursor-pointer hover:bg-gray-50 ${
            isDragOver ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
          } ${
            isDragging ? 'opacity-50' : ''
          } ${
            isInvalidDropTarget ? 'ring-2 ring-red-400 ring-opacity-50 bg-red-50' : ''
          }`}
          style={{ backgroundColor: getMenuItemColor(node.level) + '20' }} // 20% opacity
          onClick={() => toggleNodeExpansion(node.id)}
          draggable
          onDragStart={(e) => handleDragStart(e, node)}
          onDragOver={(e) => handleDragOver(e, node)}
          onDrop={(e) => handleDrop(e, node)}
          onDragEnd={handleDragEnd}
        >
          {/* Drag Handle */}
          <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors">
            <GripVertical size={14} />
          </div>

          {/* Color Dot */}
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: getMenuItemColor(node.level) }}
          ></div>

          {/* Level indicator and expand/collapse */}
          <div className="flex items-center gap-1">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNodeExpansion(node.id);
                }}
                className="p-0.5 hover:bg-white/50 rounded"
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            )}
            {!hasChildren && <div className="w-4" />}
          </div>

          {/* Icon */}
          <IconRenderer iconUrl={node.data.iconUrl} />

          {/* Title */}
          <div className="flex-1">
            <span className="font-medium text-gray-800 text-sm">{node.data.title}</span>
            {node.data.menu_id && (
              <span className="ml-1 text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                ID: {node.data.menu_id}
              </span>
            )}
            <span className={`ml-1 text-xs px-1.5 py-0.5 rounded ${
              isSubmenu 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {isSubmenu ? 'Submenu' : 'Menu'}
            </span>
            {node.level > 0 && (
              <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                L{node.level}
              </span>
            )}
            {/* Show route info for menu items - inline */}
            {!isSubmenu && node.data.route && (
              <span className="ml-2 text-xs text-gray-600">
                • {node.data.route}
                {node.data.routeArgs && (
                  <span className="text-gray-500"> (args)</span>
                )}
              </span>
            )}

            {/* Warning for menu items with children (shouldn't happen) */}
            {!isSubmenu && hasChildren && (
              <div className="mt-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                ⚠️ Item menu tidak seharusnya memiliki submenu. Ubah menjadi submenu atau hapus menu dibawahnya.
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openEditModal(node);
              }}
              className="p-1 text-gray-500 hover:text-blue-600 rounded"
              title="Edit"
            >
              <Edit3 size={12} />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                duplicateNode(node.id);
              }}
              className="p-1 text-gray-500 hover:text-purple-600 rounded"
              title="Duplikat item"
            >
              <Copy size={12} />
            </button>
            
            {isSubmenu && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openAddItemModal(node.id);
                }}
                className="p-1 text-gray-500 hover:text-green-600 rounded"
                title="Tambah Item"
              >
                <Plus size={12} />
              </button>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteNode(node.id);
              }}
              className="p-1 text-gray-500 hover:text-red-600 rounded"
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Drag and drop visual indicators */}
        {isDragOver && dragState.dragOverPosition && (
          <>
            {/* Before/After indicators - show above/below the node for reordering */}
            {(dragState.dragOverPosition === 'before' || dragState.dragOverPosition === 'after') && (
              <div className={`h-2 mx-2 rounded-full shadow-lg ${
                dragState.dragOverPosition === 'before' ? 'bg-blue-500' : 'bg-blue-500'
              }`} />
            )}
            
            {/* Inside indicator - show below the node for parent-child */}
            {dragState.dragOverPosition === 'inside' && (
              <div className="h-2 mx-2 rounded-full bg-green-500 shadow-lg" />
            )}
          </>
        )}

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="ml-4 mt-1 border-l-2 border-gray-200 pl-3">
            {node.children.map(child => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  const renderEditModal = () => {
    if (!showEditModal || !editingNodeData) return null;

    const isSubmenu = !!editingNodeData.submenu || editingNodeData.submenuTitle || editingNodeData.submenuStyle || editingNodeData.submenuLayout;
    
    // Debug logging
    console.log('Edit Modal - editingNodeData:', editingNodeData);
    console.log('Edit Modal - isSubmenu:', isSubmenu);
    console.log('Edit Modal - submenu properties:', {
      submenu: editingNodeData.submenu,
      submenuTitle: editingNodeData.submenuTitle,
      submenuStyle: editingNodeData.submenuStyle,
      submenuLayout: editingNodeData.submenuLayout
    });

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Edit Item Menu</h3>
              {editModalHasChanges && (
                <div className="flex items-center gap-1 mt-1 text-xs text-orange-600">
                  <AlertTriangle size={12} />
                  <span>Anda memiliki perubahan yang belum disimpan</span>
                </div>
              )}
            </div>
            <button
              onClick={closeEditModal}
              className={`p-1 rounded transition-colors ${
                editModalHasChanges 
                  ? 'text-orange-600 hover:bg-orange-100' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title={editModalHasChanges ? 'Tutup (ada perubahan yang belum disimpan)' : 'Tutup'}
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column - Basic Settings */}
              <div className="space-y-4">


                <div className="form-group">
                  <label className="form-label text-sm">Menu ID</label>
                  <input
                    type="text"
                    className="form-input text-sm py-2 w-full bg-gray-100"
                    value={editingNodeData.menu_id || 'Akan dibuat otomatis'}
                    disabled
                    placeholder="Akan dibuat otomatis"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    ID otomatis berdasarkan judul menu
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label text-sm">Ikon</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="form-input text-sm py-2 flex-1"
                      value={editingNodeData.iconUrl || ''}
                      onChange={(e) => updateNode({ iconUrl: e.target.value })}
                      placeholder="📱 or URL"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
                      title="Upload icon"
                    >
                      <Upload size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAssetPicker(true)}
                      className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center gap-1"
                      title="Select from assets"
                    >
                      <ImageIcon size={14} />
                    </button>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label text-sm">Ukuran Teks</label>
                  <input
                    type="number"
                    className="form-input text-sm py-2 w-full"
                    value={editingNodeData.textSize || 11}
                    onChange={(e) => updateNode({ textSize: parseFloat(e.target.value) })}
                    min="8"
                    max="20"
                    step="0.5"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label text-sm">Judul</label>
                  <input
                    type="text"
                    className="form-input text-sm py-2 w-full"
                    value={editingNodeData.title || ''}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      // Get all existing menu IDs to check for duplicates
                      const getAllMenuIds = (tree: TreeNode[]): string[] => {
                        const ids: string[] = [];
                        tree.forEach(node => {
                          if (node.data.menu_id) ids.push(node.data.menu_id);
                          ids.push(...getAllMenuIds(node.children));
                        });
                        return ids;
                      };
                      const existingIds = getAllMenuIds(menuTree);
                      const newMenuId = generateMenuId(newTitle, existingIds);
                      updateNode({ 
                        title: newTitle,
                        menu_id: newMenuId
                      });
                    }}
                    placeholder="Judul Item Menu"
                  />
                </div>
              </div>

              {/* Right Column - Navigation & Submenu */}
              <div className="space-y-4">
                    {/* Route and URL fields - only show for menu items (not submenus) */}
                {!isSubmenu && (
                  <div className="form-group">
                    <label className="form-label text-sm">Konfigurasi Navigasi</label>
                    <div className="p-3 bg-gray-50 rounded border">
                      <RouteArgsEditor
                        route={editingNodeData.route}
                        url={editingNodeData.url}
                        routeArgs={editingNodeData.routeArgs}
                        onChange={(config) => {
                          updateNode({
                            route: config.route,
                            url: config.url,
                            routeArgs: config.routeArgs
                          });
                        }}
                        showValidation={true}
                        allowUrlMode={true}
                        allowRouteMode={true}
                      />
                    </div>
                  </div>
                )}

                {/* Submenu Configuration - always show for submenu type */}
                {isSubmenu && (
                  <div className="form-group">
                    <label className="form-label text-sm">Konfigurasi Submenu</label>
                    <div className="space-y-3 p-3 bg-green-50 rounded border border-green-200">
                      {/* Submenu Title */}
                      <div className="form-group">
                        <label className="form-label text-xs">Judul Submenu</label>
                        <input
                          type="text"
                          className="form-input text-xs py-1 w-full"
                          value={editingNodeData.submenu?.submenuTitle || editingNodeData.submenuTitle || 'Submenu'}
                          onChange={(e) => updateNode({ 
                            submenu: {
                              id: editingNodeData.submenu?.id || `submenu_${Date.now()}`,
                              submenuTitle: e.target.value || 'Submenu',
                              submenuStyle: editingNodeData.submenu?.submenuStyle || 'fullScreen',
                              submenuLayout: editingNodeData.submenu?.submenuLayout || 'grid',
                              items: editingNodeData.submenu?.items || []
                            },
                            submenuTitle: e.target.value || 'Submenu'
                          })}
                          placeholder="Submenu Title"
                        />
                      </div>

                      {/* Submenu Style */}
                      <div className="form-group">
                        <label className="form-label text-xs">Gaya Submenu</label>
                        <select
                          className="form-input text-xs py-1 w-full"
                          value={editingNodeData.submenu?.submenuStyle || editingNodeData.submenuStyle || 'fullScreen'}
                          onChange={(e) => {
                            const newStyle = e.target.value as 'fullScreen' | 'bottomSheet';
                            const newLayout = newStyle === 'bottomSheet' ? 'grid' : (editingNodeData.submenu?.submenuLayout || editingNodeData.submenuLayout || 'grid');
                            
                            updateNode({ 
                              submenu: {
                                id: editingNodeData.submenu?.id || `submenu_${Date.now()}`,
                                submenuTitle: editingNodeData.submenu?.submenuTitle || 'Submenu',
                                submenuStyle: newStyle,
                                submenuLayout: newLayout,
                                items: editingNodeData.submenu?.items || []
                              },
                              submenuStyle: newStyle,
                              submenuLayout: newLayout
                            });
                          }}
                        >
                          <option value="fullScreen">Layar Penuh</option>
                          <option value="bottomSheet">Bottom Sheet</option>
                        </select>
                      </div>

                      {/* Submenu Layout */}
                      <div className="form-group">
                        <label className="form-label text-xs">Tata Letak Submenu</label>
                        <select
                          className="form-input text-xs py-1 w-full"
                          value={editingNodeData.submenu?.submenuLayout || editingNodeData.submenuLayout || 'grid'}
                          onChange={(e) => updateNode({ 
                            submenu: {
                              id: editingNodeData.submenu?.id || `submenu_${Date.now()}`,
                              submenuTitle: editingNodeData.submenu?.submenuTitle || 'Submenu',
                              submenuStyle: editingNodeData.submenu?.submenuStyle || 'fullScreen',
                              submenuLayout: e.target.value as 'grid' | 'list',
                              items: editingNodeData.submenu?.items || []
                            },
                            submenuLayout: e.target.value as 'grid' | 'list'
                          })}
                          disabled={editingNodeData.submenu?.submenuStyle === 'bottomSheet'}
                        >
                          <option value="grid">Grid (4x4)</option>
                          <option value="list" disabled={editingNodeData.submenu?.submenuStyle === 'bottomSheet'}>
                            Daftar {editingNodeData.submenu?.submenuStyle === 'bottomSheet' ? '(Tidak tersedia untuk Bottom Sheet)' : ''}
                          </option>
                        </select>
                        {editingNodeData.submenu?.submenuStyle === 'bottomSheet' && (
                          <div className="text-xs text-gray-500 mt-1">
                            Bottom Sheet hanya mendukung tata letak Grid
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={closeEditModal}
                className="flex-1 px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={saveEditModal}
                className={`flex-1 px-4 py-2 text-sm rounded-lg transition-colors ${
                  editModalHasChanges 
                    ? 'bg-orange-500 text-white hover:bg-orange-600' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {editModalHasChanges ? 'Simpan Perubahan*' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };



  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[80vw] max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Editor Menu</h2>
            <p className="text-xs text-gray-600">Editor struktur menu gaya pohon</p>
            {hasUnsavedChanges && (
              <div className="flex items-center gap-1 mt-1 text-xs text-orange-600">
                <AlertTriangle size={12} />
                <span>Anda memiliki perubahan yang belum disimpan</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Batal
            </button>
            
            <button
              onClick={() => {
                console.log('MenuEditor: Save button clicked');
                saveChanges();
              }}
              className={`px-6 py-2 rounded-lg transition-colors ${
                hasUnsavedChanges 
                  ? 'bg-orange-500 text-white hover:bg-orange-600' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              <Save size={16} className="inline mr-2" />
              {hasUnsavedChanges ? 'Simpan Perubahan*' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="mb-3">
            <button
              onClick={() => addMenuItem()}
              className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Plus size={16} />
              Tambah Item
            </button>
          </div>

          {/* Warning Message */}
          {warningMessage && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">!</span>
                </div>
                <span className="text-sm font-medium text-orange-800">{warningMessage}</span>
              </div>
            </div>
          )}

          {/* Tree Structure */}
          <div className="space-y-2">
            {menuTree.map(node => renderNode(node))}
          </div>

          {/* Root Level Drop Zone */}
          {dragState.isDragging && dragState.draggedNode && (
            <div 
              className={`mt-2 p-4 border-2 border-dashed rounded-lg text-center transition-all duration-200 ${
                dragState.dragOverNode === null && dragState.dragOverPosition === 'after' 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 bg-gray-50'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDragState(prev => ({
                  ...prev,
                  dragOverNode: null,
                  dragOverPosition: 'after'
                }));
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (!dragState.draggedNode) return;
                
                // Create a deep copy of the tree
                const deepCloneTree = (tree: TreeNode[]): TreeNode[] => {
                  return tree.map(node => ({
                    ...node,
                    children: deepCloneTree(node.children)
                  }));
                };
                
                let updatedTree = deepCloneTree(menuTree);
                
                // First remove the dragged node from its original position
                const removeNodeFromTree = (tree: TreeNode[], nodeId: string): boolean => {
                  for (let i = 0; i < tree.length; i++) {
                    if (tree[i].id === nodeId) {
                      tree.splice(i, 1);
                      return true;
                    }
                    if (removeNodeFromTree(tree[i].children, nodeId)) {
                      return true;
                    }
                  }
                  return false;
                };
                
                // Remove the dragged node
                removeNodeFromTree(updatedTree, dragState.draggedNode.id);
                
                // Add to root level
                updatedTree.push({
                  ...dragState.draggedNode,
                  level: 0
                });
                
                setMenuTree(updatedTree);
                setDragState({
                  isDragging: false,
                  draggedNode: null,
                  draggedNodeParent: null,
                  draggedNodeIndex: -1,
                  dragOverNode: null,
                  dragOverPosition: null
                });
              }}
            >
              <div className="text-gray-500 text-sm">
                {dragState.dragOverNode === null && dragState.dragOverPosition === 'after' 
                  ? 'Lepas di sini untuk menambahkan ke level akar' 
                  : 'Lepas di sini untuk menambahkan ke level akar'
                }
              </div>
            </div>
          )}

          {menuTree.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">🌳</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Pohon Menu Kosong</h3>
              <p className="text-sm text-gray-500 mb-4">Mulai membangun struktur menu Anda dengan menambahkan item menu</p>
              <button
                onClick={() => addMenuItem()}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors mx-auto"
              >
                <Plus size={16} />
                Tambah Item Pertama
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Choice Modal */}
      {showAddChoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-80 max-w-[90vw]">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Tambah Item Baru</h3>
              <button
                onClick={() => setShowAddChoice(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Pilih jenis item yang ingin Anda buat:
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => createNewMenuItem('menu')}
                  className="w-full p-3 text-left border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">📱</span>
                    </div>
                    <div>
                                          <div className="font-medium text-gray-800">Item Menu</div>
                    <div className="text-xs text-gray-600">Berpindah ke rute atau URL</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => createNewMenuItem('submenu')}
                  className="w-full p-3 text-left border rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">📁</span>
                    </div>
                    <div>
                                          <div className="font-medium text-gray-800">Submenu</div>
                    <div className="text-xs text-gray-600">Berisi item menu lainnya</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Item to Branch Modal */}
      {showAddItemModal && selectedParentId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-80 max-w-[90vw]">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Tambah Item ke Submenu</h3>
              <button
                onClick={() => {
                  setShowAddItemModal(false);
                  setSelectedParentId(null);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Pilih jenis item yang ingin Anda tambahkan ke submenu ini:
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => createNewItemInBranch('menu', selectedParentId)}
                  className="w-full p-3 text-left border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">📱</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">Item Menu</div>
                      <div className="text-xs text-gray-600">Berpindah ke rute atau URL</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => createNewItemInBranch('submenu', selectedParentId)}
                  className="w-full p-3 text-left border rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">📁</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">Submenu</div>
                      <div className="text-xs text-gray-600">Berisi item menu lainnya</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {renderEditModal()}

      {/* Unsaved Changes Dialog */}
      {showUnsavedChangesDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg w-96 max-w-[90vw] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={20} className="text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Perubahan Belum Disimpan</h3>
                <p className="text-sm text-gray-600">Anda memiliki perubahan yang belum disimpan yang akan hilang.</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-700">
                {pendingAction === 'close' 
                  ? 'Apakah Anda yakin ingin menutup editor? Semua perubahan yang belum disimpan akan hilang.'
                  : 'Apakah Anda yakin ingin membatalkan? Semua perubahan yang belum disimpan akan hilang.'
                }
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={cancelAction}
                className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Lanjutkan Mengedit
              </button>
                              <button
                  onClick={confirmAction}
                  className="flex-1 px-4 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
                >
                  Buang Perubahan
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal Unsaved Changes Dialog */}
      {showEditModalUnsavedDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg w-96 max-w-[90vw] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={20} className="text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Perubahan Belum Disimpan</h3>
                <p className="text-sm text-gray-600">Anda memiliki perubahan yang belum disimpan di modal edit. Apakah Anda yakin ingin menutup?</p>
              </div>
            </div>
            
            <div className="flex gap-3">
                              <button
                  onClick={cancelEditModalClose}
                  className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Batal
                </button>
                              <button
                  onClick={confirmEditModalClose}
                  className="flex-1 px-4 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
                >
                  Buang Perubahan
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Asset Picker Modal */}
      {showAssetPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg w-[90vw] max-w-6xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Pilih atau Upload Asset</h3>
              <button
                onClick={() => setShowAssetPicker(false)}
                className="p-1 text-gray-600 hover:text-gray-800 rounded"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <AssetsManager 
                authSeed={authSeed || localStorage.getItem('adminAuthSeed') || ''}
                refreshTrigger={assetsRefreshTrigger}
              />
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Petunjuk:</strong> Klik tombol "Copy URL" pada asset yang ingin digunakan, lalu paste URL tersebut ke field Ikon, atau klik langsung pada asset untuk memilih.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
