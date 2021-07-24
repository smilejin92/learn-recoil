import { Suspense } from 'react';
import { useRecoilState } from 'recoil';
import { elementAtom, selectedElementIdAtom } from '../../atoms';
import { Drag } from '../Drag';
import { Resize } from '../Resize';
import { RectangleContainer } from './RectangleContainer';
import { RectangleInner } from './RectangleInner';
import { RectangleLoading } from './RectangleLoading';

export const Rectangle = ({ id }: { id: number }) => {
  const [selectedElementId, setSelectedElement] = useRecoilState(selectedElementIdAtom);
  // atom family 중 id에 해당하는 atom state와 state updater를 가져옴
  const [element, setElement] = useRecoilState(elementAtom(id));
  const selected = id === selectedElementId;

  return (
    <RectangleContainer
      position={element.style.position}
      size={element.style.size}
      onSelect={() => {
        setSelectedElement(id);
      }}
    >
      <Resize
        selected={selected}
        position={element.style.position}
        size={element.style.size}
        onResize={(style) => {
          setElement({
            ...element,
            style,
          });
        }}
        keepAspectRatio={element.image !== undefined}
      >
        <Drag
          position={element.style.position}
          onDrag={(position) => {
            setElement({
              ...element,
              style: {
                ...element.style,
                position,
              },
            });
          }}
        >
          <div>
            <Suspense fallback={<RectangleLoading selected={selected} />}>
              <RectangleInner selected={selected} id={id} />
            </Suspense>
          </div>
        </Drag>
      </Resize>
    </RectangleContainer>
  );
};
