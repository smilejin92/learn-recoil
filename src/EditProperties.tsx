import {
  InputGroup,
  InputRightElement,
  NumberInput,
  NumberInputField,
  Text,
  VStack,
} from '@chakra-ui/react';
import { selector, useRecoilState } from 'recoil';
import { selectedElementState } from './Canvas';
import { Element, elementState } from './components/Rectangle/Rectangle';

const selectedElementProperties = selector<Element | undefined>({
  key: 'selectedElementProperties',
  get: ({ get }) => {
    // 1. selectedElement의 id를 selectedElementState atom으로부터 get
    const selectedElementId = get(selectedElementState);

    if (selectedElementId == null) return; // undefined

    // 2. selectedElement의 id를 사용하여, atomFamily 중 해당 id에 부합하는 atom을 return
    return get(elementState(selectedElementId)); // Element
  },
  set: ({ get, set }, newElement) => {
    // 1. selectedElement의 id를 selectedElementState atom으로부터 get
    const selectedElementId = get(selectedElementState);

    if (selectedElementId == null) return;
    if (!newElement) return;

    // 2. selectedElement의 id를 사용하여, atomFamily 중 해당 id에 부합하는 atom의 상태를 update
    set(elementState(selectedElementId), newElement);
  },
});

// 선택된 Rectangle의 상세 정보(top, left, width, height)를 카드 형태로 표시
export const EditProperties = () => {
  const [element, setElement] = useRecoilState(selectedElementProperties);

  if (!element) return null;

  const { top, left } = element.style.position;
  const { width, height } = element.style.size;

  // 리팩토링 필요
  const setPosition = (property: 'top' | 'left', value: number) => {
    setElement({
      ...element,
      style: {
        ...element.style,
        position: {
          ...element.style.position,
          [property]: value,
        },
      },
    });
  };

  // 리팩토링 필요
  const setSize = (property: 'width' | 'height', value: number) => {
    setElement({
      ...element,
      style: {
        ...element.style,
        size: {
          ...element.style.size,
          [property]: value,
        },
      },
    });
  };

  return (
    <Card>
      <Section heading="Position">
        <Property
          label="Top"
          value={top}
          onChange={(top) => {
            setPosition('top', top);
          }}
        />
        <Property
          label="Left"
          value={left}
          onChange={(left) => {
            setPosition('left', left);
          }}
        />
      </Section>
      <Section heading="Size">
        <Property
          label="Width"
          value={width}
          onChange={(width) => {
            setSize('width', width);
          }}
        />
        <Property
          label="Height"
          value={height}
          onChange={(height) => {
            setSize('height', height);
          }}
        />
      </Section>
    </Card>
  );
};

const Section: React.FC<{ heading: string }> = ({ heading, children }) => {
  return (
    <VStack spacing={2} align="flex-start">
      <Text fontWeight="500">{heading}</Text>
      {children}
    </VStack>
  );
};

const Property = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) => {
  return (
    <div>
      <Text fontSize="14px" fontWeight="500" mb="2px">
        {label}
      </Text>
      <InputGroup size="sm" variant="filled">
        <NumberInput value={value} onChange={(_, value) => onChange(value)}>
          <NumberInputField borderRadius="md" />
          <InputRightElement
            pointerEvents="none"
            children="px"
            lineHeight="1"
            fontSize="12px"
          />
        </NumberInput>
      </InputGroup>
    </div>
  );
};

const Card: React.FC = ({ children }) => (
  <VStack
    position="absolute"
    top="20px"
    right="20px"
    backgroundColor="white"
    padding={2}
    boxShadow="md"
    borderRadius="md"
    spacing={3}
    align="flex-start"
    onClick={(e) => e.stopPropagation()}
  >
    {children}
  </VStack>
);
