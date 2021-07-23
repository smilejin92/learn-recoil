import {
  InputGroup,
  InputRightElement,
  NumberInput,
  NumberInputField,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  selector,
  selectorFamily,
  useRecoilState,
  useRecoilValue,
} from 'recoil';
import { selectedElementState } from './Canvas';
import { elementState } from './components/Rectangle/Rectangle';
import _ from 'lodash';
import produce from 'immer';
import { ImageInfo, ImageInfoFallback } from './components/ImageInfo';
import { Suspense } from 'react';

/**
 * Selector의 장점
 * 1. get, set 로직이 한 곳에 작성되어있음
 * 2. Atom과 같은 API를 사용
 * 3. 공유 가능하며, self-contained state를 가짐
 */

/**
 * 언제 selectorFamily를 사용하는가?
 * 비슷한 데이터를 get, set하지만 parametar에 따라 동작 여부가 조금씩 달라질때
 */

// <returnType, paramsType>
export const editPropertyState = selectorFamily<
  any,
  { path: string; id: number }
>({
  key: 'editProperty',
  // path: serializable value - element 객체의 특정 property를 참조하기 위한 string(ex. 'foo.bar')
  get:
    ({ path, id }) =>
    ({ get }) => {
      const element = get(elementState(id));

      return _.get(element, path);
    },
  set:
    ({ path, id }) =>
    ({ get, set }, newValue) => {
      const element = get(elementState(id));

      // NOTE: lodash.set mutates the object, and recoil relies on immutability
      // 아래 코드는 re-render 시키지 않음
      // set(elementState(selectedElementId), _.set(element, path, newValue));

      // immer produce: element의 deep copied 객체를 draft로 전달 받아 mutate
      const newElement = produce(element, (draft) => {
        _.set(draft, path, newValue);
      });
      set(elementState(id), newElement);
    },
});

const hasImageState = selector({
  key: 'hasImage',
  get: ({ get }) => {
    const id = get(selectedElementState);
    if (id === null) return;

    const element = get(elementState(id));
    return element.image !== undefined;
  },
});

export const EditProperties = () => {
  const selectedElementId = useRecoilValue(selectedElementState);
  // const hasImage = useRecoilValue(hasImageState);

  if (selectedElementId === null) return null;

  return (
    <Card>
      <Section heading="Position">
        <Property
          label="Top"
          path="style.position.top"
          id={selectedElementId}
        />
        <Property
          label="Left"
          path="style.position.left"
          id={selectedElementId}
        />
      </Section>
      <Section heading="Size">
        <Property
          label="Width"
          path="style.size.width"
          id={selectedElementId}
        />
        <Property
          label="Height"
          path="style.size.height"
          id={selectedElementId}
        />
      </Section>
      {/* {hasImage && (
        <Section heading="Image">
          <Suspense fallback={<ImageInfoFallback />}>
            <ImageInfo />
          </Suspense>
        </Section>
      )} */}
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
  path,
  id,
}: {
  label: string;
  path: string;
  id: number;
}) => {
  // atomFamily처럼 함수 호출
  const [value, setValue] = useRecoilState(editPropertyState({ path, id }));

  return (
    <div>
      <Text fontSize="14px" fontWeight="500" mb="2px">
        {label}
      </Text>
      <InputGroup size="sm" variant="filled">
        <NumberInput value={value} onChange={(_, value) => setValue(value)}>
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

// // 문제점: selectedElementId에 해당하는 요소를 통째로 get, set
// // 만약 선택된 요소의 부분적 정보를 get, set 하려면 어떡해야하나?
// const selectedElementProperties = selector<Element | undefined>({
//   key: 'selectedElementProperties',
//   get: ({ get }) => {
//     // 1. selectedElement의 id를 selectedElementState atom으로부터 get
//     const selectedElementId = get(selectedElementState);

//     if (selectedElementId == null) return; // undefined

//     // 2. selectedElement의 id를 사용하여, atomFamily 중 해당 id에 부합하는 atom을 return
//     return get(elementState(selectedElementId)); // Element
//   },
//   set: ({ get, set }, newElement) => {
//     // 1. selectedElement의 id를 selectedElementState atom으로부터 get
//     const selectedElementId = get(selectedElementState);

//     if (selectedElementId == null) return;
//     if (!newElement) return;

//     // 2. selectedElement의 id를 사용하여, atomFamily 중 해당 id에 부합하는 atom의 상태를 update
//     set(elementState(selectedElementId), newElement);
//   },
// });

// // 선택된 Rectangle의 상세 정보(top, left, width, height)를 카드 형태로 표시
// export const EditProperties = () => {
//   const [element, setElement] = useRecoilState(selectedElementProperties);

//   if (!element) return null;

//   const { top, left } = element.style.position;
//   const { width, height } = element.style.size;

//   // 리팩토링 필요
//   const setPosition = (property: 'top' | 'left', value: number) => {
//     setElement({
//       ...element,
//       style: {
//         ...element.style,
//         position: {
//           ...element.style.position,
//           [property]: value,
//         },
//       },
//     });
//   };

//   // 리팩토링 필요
//   const setSize = (property: 'width' | 'height', value: number) => {
//     setElement({
//       ...element,
//       style: {
//         ...element.style,
//         size: {
//           ...element.style.size,
//           [property]: value,
//         },
//       },
//     });
//   };

//   return (
//     <Card>
//       <Section heading="Position">
//         <Property
//           label="Top"
//           value={top}
//           onChange={(top) => {
//             setPosition('top', top);
//           }}
//         />
//         <Property
//           label="Left"
//           value={left}
//           onChange={(left) => {
//             setPosition('left', left);
//           }}
//         />
//       </Section>
//       <Section heading="Size">
//         <Property
//           label="Width"
//           value={width}
//           onChange={(width) => {
//             setSize('width', width);
//           }}
//         />
//         <Property
//           label="Height"
//           value={height}
//           onChange={(height) => {
//             setSize('height', height);
//           }}
//         />
//       </Section>
//     </Card>
//   );
// };

// const Section: React.FC<{ heading: string }> = ({ heading, children }) => {
//   return (
//     <VStack spacing={2} align="flex-start">
//       <Text fontWeight="500">{heading}</Text>
//       {children}
//     </VStack>
//   );
// };

// const Property = ({
//   label,
//   value,
//   onChange,
// }: {
//   label: string;
//   value: number;
//   onChange: (value: number) => void;
// }) => {
//   return (
//     <div>
//       <Text fontSize="14px" fontWeight="500" mb="2px">
//         {label}
//       </Text>
//       <InputGroup size="sm" variant="filled">
//         <NumberInput value={value} onChange={(_, value) => onChange(value)}>
//           <NumberInputField borderRadius="md" />
//           <InputRightElement
//             pointerEvents="none"
//             children="px"
//             lineHeight="1"
//             fontSize="12px"
//           />
//         </NumberInput>
//       </InputGroup>
//     </div>
//   );
// };

// const Card: React.FC = ({ children }) => (
//   <VStack
//     position="absolute"
//     top="20px"
//     right="20px"
//     backgroundColor="white"
//     padding={2}
//     boxShadow="md"
//     borderRadius="md"
//     spacing={3}
//     align="flex-start"
//     onClick={(e) => e.stopPropagation()}
//   >
//     {children}
//   </VStack>
// );
