import { Box, Text, VStack } from '@chakra-ui/layout';
import { Skeleton } from '@chakra-ui/skeleton';
import { selector, useRecoilValue } from 'recoil';
import { callApi } from '../api';
import { selectedElementState } from '../Canvas';
import { elementState } from './Rectangle/Rectangle';

// intermediate selector
const imageIdState = selector({
  key: 'imageId',
  get: ({ get }) => {
    const id = get(selectedElementState);
    if (id === null) return;

    const element = get(elementState(id));
    return element.image?.id;
  },
});

const imageInfoState = selector({
  key: 'imageInfo',
  get: ({ get }) => {
    // imageIdState selector가 re-run되도 value of state는 stay same.
    // 따라서 imageInfoState selector는 re-run되지 않음
    const imageId = get(imageIdState);
    if (imageId === undefined) return;

    // element가 업데이트될때마다 selector가 계속 호출됨. imageId가 바뀔 때만 re-run될 수 있도록 수정
    // const id = get(selectedElementState);
    // if (id === null) return;

    // const element = get(elementState(id));
    // const imageId = element.image?.id;

    return callApi('image-detail', {
      queryParams: {
        seed: imageId,
      },
    });
  },
});

export const ImageInfo = () => {
  const imageInfo = useRecoilValue(imageInfoState);

  return (
    <VStack spacing={2} alignItems="flex-start" width="100%">
      <Info label="Author" value={imageInfo.author} />
      <Info label="Image URL" value={imageInfo.url} />
    </VStack>
  );
};

export const ImageInfoFallback = () => {
  return (
    <VStack spacing={2} alignItems="flex-start" width="100%">
      <Info label="Author" />
      <Info label="Image URL" />
    </VStack>
  );
};

export const Info = ({ label, value }: { label: string; value?: string }) => {
  return (
    <Box width="175px">
      <Text fontSize="14px" fontWeight="500" mb="2px">
        {label}
      </Text>
      {value === undefined ? (
        <Skeleton width="100%" height="21px" />
      ) : (
        <Text fontSize="14px">{value}</Text>
      )}
    </Box>
  );
};
