# Styles Directory

This directory contains reusable UI components and styles for the application to ensure consistency across the web interface.

## Components

### Spinner

A loading spinner component with customizable size and color.

#### Props

- `size` (optional): 'sm' | 'md' | 'lg' - Size of the spinner (default: 'md')
- `color` (optional): string - Color of the spinner (default: 'text-blue-600')
- `className` (optional): string - Additional CSS classes

#### Usage

```tsx
import { Spinner } from '../styles';

<Spinner size="lg" color="text-green-600" />
```

### Modal

A reusable modal component with consistent styling and behavior.

#### Props

- `isOpen`: boolean - Controls modal visibility
- `onClose`: () => void - Function called when modal is closed
- `children`: React.ReactNode - Modal content
- `title` (optional): string - Modal title
- `size` (optional): 'sm' | 'md' | 'lg' | 'xl' | 'full' - Modal size (default: 'md')
- `showCloseButton` (optional): boolean - Show close button (default: true)

#### Usage

```tsx
import { Modal } from '../styles';

<Modal isOpen={showModal} onClose={() => setShowModal(false)} title="User Details" size="lg">
  <p>Modal content here</p>
</Modal>
```

### Tabs

A tab navigation component with multiple variants.

#### Props

- `tabs`: Array of { id: string, label: string, count?: number } - Tab definitions
- `activeTab`: string - Currently active tab ID
- `onTabChange`: (tabId: string) => void - Tab change handler
- `variant` (optional): 'default' | 'pills' | 'underline' - Tab style variant (default: 'default')

#### Usage

```tsx
import { Tabs } from '../styles';

const tabs = [
  { id: 'details', label: 'Details' },
  { id: 'sessions', label: 'Sessions', count: 5 }
];

<Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
```

### Table

A reusable table component with consistent styling and variants.

#### Props

- `columns`: Array of { key: string, label: string, width?: string, align?: 'left' | 'center' | 'right' } - Column definitions
- `data`: any[] - Table data
- `variant` (optional): 'default' | 'compact' | 'striped' - Table style variant (default: 'default')
- `onRowClick` (optional): (row: any) => void - Row click handler
- `emptyMessage` (optional): string - Message shown when no data (default: 'No data available')

#### Usage

```tsx
import { Table } from '../styles';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' }
];

<Table columns={columns} data={users} variant="striped" />
```

### Button

A button component with multiple variants, sizes, and states.

#### Props

- `children`: React.ReactNode - Button content
- `onClick` (optional): () => void - Click handler
- `variant` (optional): 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' - Button style (default: 'primary')
- `size` (optional): 'xs' | 'sm' | 'md' | 'lg' - Button size (default: 'md')
- `disabled` (optional): boolean - Disabled state (default: false)
- `loading` (optional): boolean - Loading state with spinner (default: false)
- `type` (optional): 'button' | 'submit' | 'reset' - Button type (default: 'button')
- `className` (optional): string - Additional CSS classes
- `icon` (optional): React.ReactNode - Icon element
- `iconPosition` (optional): 'left' | 'right' - Icon position (default: 'left')

#### Usage

```tsx
import { Button } from '../styles';

<Button variant="success" size="lg" loading={isLoading} onClick={handleSave}>
  Save Changes
</Button>
```

### Badge

A badge component for status indicators and labels.

#### Props

- `children`: React.ReactNode - Badge content
- `variant` (optional): 'success' | 'danger' | 'warning' | 'info' | 'default' - Badge style (default: 'default')
- `size` (optional): 'sm' | 'md' | 'lg' - Badge size (default: 'md')
- `className` (optional): string - Additional CSS classes

#### Usage

```tsx
import { Badge } from '../styles';

<Badge variant="success">Active</Badge>
<Badge variant="danger" size="lg">Error</Badge>
```

### ImageOverlay

A full-screen overlay for displaying images with close functionality.

#### Props

- `isOpen`: boolean - Controls overlay visibility
- `onClose`: () => void - Function called when overlay is closed
- `imageUrl`: string - URL of the image to display
- `title` (optional): string - Image title
- `alt` (optional): string - Image alt text (default: 'Image')

#### Usage

```tsx
import { ImageOverlay } from '../styles';

<ImageOverlay 
  isOpen={showImage} 
  onClose={() => setShowImage(false)} 
  imageUrl="/path/to/image.jpg" 
  title="Verification Document"
/>
```

## Benefits

- **Consistency**: All UI elements follow the same design patterns
- **Reusability**: Components can be used across different parts of the application
- **Maintainability**: Changes to styling only need to be made in one place
- **Accessibility**: Built-in accessibility features for better user experience
- **Type Safety**: Full TypeScript support with proper interfaces

## Testing

A test component is available at `SpinnerTest.tsx` to demonstrate all spinner variations and ensure they work correctly.
