import { Box } from '@chakra-ui/react';
import { useEffect } from 'react';
import { selectorFamily, useRecoilValue, useSetRecoilState } from 'recoil';
import { editPropertyState } from '../../EditProperties';
import { getBorderColor, getImageDimensions } from '../../util';
import { elementState } from './Rectangle';

const imageSizeState = selectorFamily({
  key: 'imageSize',
  // async selector이지만, Promise가 resolve 될 때까지 알아서 기다려줌
  get: (src: string | undefined) => () => {
    if (!src) return;
    return getImageDimensions(src);
  },
});

export const RectangleInner = ({
  selected,
  id,
}: {
  selected: boolean;
  id: number;
}) => {
  const element = useRecoilValue(elementState(id));
  const imageSize = useRecoilValue(imageSizeState(element.image?.src));
  const setSize = useSetRecoilState(
    editPropertyState({ path: 'style.size', id }),
  );

  useEffect(() => {
    if (!imageSize) return;
    setSize(imageSize);
  }, [imageSize, setSize]);

  return (
    <Box
      position="absolute"
      border={`1px solid ${getBorderColor(selected)}`}
      transition="0.1s border-color ease-in-out"
      width="100%"
      height="100%"
      display="flex"
      padding="2px"
    >
      <Box
        flex="1"
        border="3px dashed #101010"
        borderRadius="255px 15px 225px 15px/15px 225px 15px 255px"
        backgroundColor="white"
        backgroundImage={`url('${element.image?.src}')`}
        backgroundSize="cover"
      />
    </Box>
  );
};
