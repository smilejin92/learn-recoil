import { Suspense } from 'react';
import { atomFamily, useRecoilState } from 'recoil';
import { selectedElementState } from '../../Canvas';
import { Drag } from '../Drag';
import { Resize } from '../Resize';
import { RectangleContainer } from './RectangleContainer';
import { RectangleInner } from './RectangleInner';
import { RectangleLoading } from './RectangleLoading';

export type ElementStyle = {
  position: { top: number; left: number };
  size: { width: number; height: number };
};

export type Element = {
  style: ElementStyle;
  image?: {
    id: number;
    src: string;
  };
};

export const defaultElement = {
  style: {
    position: {
      top: 0,
      left: 0,
    },
    size: {
      width: 200,
      height: 200,
    },
  },
};

/**
 * elementState(1) -> atom for element 1
 * elementState(2) -> atom for element 2
 * elementState(3) -> atom for element 3
 * elementState(4) -> atom for element 4
 */
/**
 * 여러 아이템에 대한 상태를 하나의 Context로 관리하면, 각 아이템에 대한 상태를 isolate 시킬 수 없다.
 * 즉, 하나의 아이템에 대한 상태를 업데이트하면, 모든 아이템의 상태도 업데이트된다 (불필요한 리렌더링).
 * atomFamily를 사용하면 각 아이템에 대한 atom이 생성되며, 해당 아이템이 업데이트 될 경우 그 아이템만 업데이트, 리렌더링된다.
 */
export const elementState = atomFamily<Element, number>({
  key: 'element',
  default: defaultElement,
});

export const Rectangle = ({ id }: { id: number }) => {
  const [selectedElement, setSelectedElement] =
    useRecoilState(selectedElementState);

  // atom family 중 id에 해당하는 atom state와 state updater를 가져옴
  const [element, setElement] = useRecoilState(elementState(id));

  const selected = id === selectedElement;

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
