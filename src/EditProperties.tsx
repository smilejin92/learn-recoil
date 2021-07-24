import { InputGroup, InputRightElement, NumberInput, NumberInputField, Text, VStack } from '@chakra-ui/react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { elementPropsSelector, elementSizePropSelector, selectedElementIdAtom } from './atoms';
// import { hasImageSelector } from './atoms';
// import { ImageInfo, ImageInfoFallback } from './components/ImageInfo';
// import { Suspense } from 'react';

export const EditProperties = () => {
  // const hasImage = useRecoilValue(hasImageState);
  const selectedElementId = useRecoilValue(selectedElementIdAtom);
  if (selectedElementId === null) return null;

  return (
    <Card>
      <Section heading="Position">
        <Property label="Top" propPath="style.position.top" id={selectedElementId} />
        <Property label="Left" propPath="style.position.left" id={selectedElementId} />
      </Section>
      <Section heading="Size">
        <SizeProperty label="Width" dimension="width" id={selectedElementId} />
        <SizeProperty label="Height" dimension="height" id={selectedElementId} />
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

const Property = ({ label, propPath, id }: { label: string; propPath: string; id: number }) => {
  const [value, setValue] = useRecoilState(elementPropsSelector({ propPath, id }));
  return <PropertyInput label={label} value={value} onChange={setValue} />;
};

const SizeProperty = ({ label, dimension, id }: { label: string; dimension: 'width' | 'height'; id: number }) => {
  const [value, setValue] = useRecoilState(elementSizePropSelector({ dimension, id }));
  return <PropertyInput label={label} value={value} onChange={setValue} />;
};

const PropertyInput = ({
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
          <InputRightElement pointerEvents="none" children="px" lineHeight="1" fontSize="12px" />
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
