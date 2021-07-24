import { DraggableCore } from 'react-draggable';
import { ElementStyle } from '../atoms/types';

type DragProps = {
  position: ElementStyle['position'];
  onDrag: (position: ElementStyle['position']) => void;
};

export const Drag: React.FC<DragProps> = ({ position, onDrag, children }) => {
  return (
    <DraggableCore
      onDrag={(e: any) => {
        onDrag({
          left: e.movementX + position.left,
          top: e.movementY + position.top,
        });
      }}
    >
      {children}
    </DraggableCore>
  );
};
