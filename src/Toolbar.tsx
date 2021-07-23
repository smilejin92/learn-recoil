import { Icon, IconButton, VStack } from '@chakra-ui/react';
import { Square, Image } from 'react-feather';
import { useRecoilCallback, useRecoilValue } from 'recoil';
import { elementsState } from './Canvas';
import { defaultElement, elementState } from './components/Rectangle/Rectangle';
import { getRandomImage } from './util';

export const Toolbar = () => {
  const elements = useRecoilValue(elementsState);
  const newId = elements.length;

  // 아이템 추가 시, elementsState와 elementState(id)의 상태를 업데이트
  const insertElement = useRecoilCallback(
    ({ set }) =>
      (type: 'rectangle' | 'image') => {
        set(elementsState, (e) => [...e, e.length]);

        if (type === 'image') {
          set(elementState(newId), {
            ...defaultElement,
            image: getRandomImage(),
          });
        }
      },
  );

  return (
    <VStack
      position="absolute"
      top="20px"
      left="20px"
      backgroundColor="white"
      padding={2}
      boxShadow="md"
      borderRadius="md"
      spacing={2}
    >
      <IconButton
        onClick={() => insertElement('rectangle')}
        aria-label="Add rectangle"
        icon={<Icon style={{ width: 24, height: 24 }} as={Square} />}
      />
      <IconButton
        onClick={() => insertElement('image')}
        aria-label="Add Image"
        icon={<Icon style={{ width: 24, height: 24 }} as={Image} />}
      />
    </VStack>
  );
};
