import { Box } from '@chakra-ui/react';
import { useEffect } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { elementAtom, elementPropsSelector, imageSizeSelector } from '../../atoms';
import { getBorderColor } from '../../util';

export const RectangleInner = ({ selected, id }: { selected: boolean; id: number }) => {
  const element = useRecoilValue(elementAtom(id));
  const imageSize = useRecoilValue(imageSizeSelector(element.image?.src));
  const setSize = useSetRecoilState(elementPropsSelector({ propPath: 'style.size', id }));

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
