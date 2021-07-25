import { Button } from '@chakra-ui/button';
import { Input } from '@chakra-ui/input';
import { Box, Divider, Heading, VStack } from '@chakra-ui/layout';
import React, { useState } from 'react';
import {
  atom,
  AtomEffect,
  atomFamily,
  DefaultValue,
  useRecoilCallback,
  useRecoilState,
  useRecoilValue,
  useResetRecoilState,
} from 'recoil';

type ItemType = {
  label: string;
  checked: boolean;
};

// reuseable atom effect
// node = effects in atomFamily ? a single atom from atomFamily : an atom
const persistLocalStorage: AtomEffect<any> = ({ onSet, setSelf, node }) => {
  const storedData = localStorage.getItem(node.key);
  if (storedData !== null) {
    setSelf(JSON.parse(storedData));
  }

  onSet((newItemIds) => {
    if (newItemIds instanceof DefaultValue) {
      localStorage.removeItem(node.key);
    } else {
      localStorage.setItem(node.key, JSON.stringify(newItemIds));
    }
  });
};

const itemIdsAtom = atom<number[]>({
  key: 'ids',
  default: [],
  effects_UNSTABLE: [persistLocalStorage],
});

const itemAtom = atomFamily<ItemType, number>({
  key: 'item',
  default: { label: '', checked: false },
  /**
   * how to persist atomFamily data back to localStorage?
   * use atom effect api
   * 1개 이상의 effect를 배열로 전달. 전달된 effect는 "하나의" atom state initialize(ex. 새로고침), update 시 호출됨
   */
  effects_UNSTABLE: [persistLocalStorage],
});

export const AtomEffects2 = () => {
  const ids = useRecoilValue(itemIdsAtom);
  const resetList = useResetRecoilState(itemIdsAtom);
  const nextId = ids.length;

  const insertItem = useRecoilCallback(({ set }) => (label: string) => {
    set(itemIdsAtom, [...ids, nextId]);
    set(itemAtom(nextId), { label, checked: false });
  });

  return (
    <Container onClear={() => resetList()}>
      {ids.map((id) => (
        <Item key={id} id={id} />
      ))}
      <NewItemInput
        onInsert={(label) => {
          insertItem(label);
        }}
      />
    </Container>
  );
};

const Container: React.FC<{ onClear: () => void }> = ({ children, onClear }) => {
  return (
    <Box display="flex" flexDir="column" alignItems="center" pt={10}>
      <Box width="400px" backgroundColor="yellow.100" p={5} borderRadius="lg">
        <Heading size="lg" mb={4}>
          Shopping List
        </Heading>
        <VStack spacing={3} divider={<Divider borderColor="rgba(86, 0, 0, 0.48)" />}>
          {children}
        </VStack>
      </Box>
      <Button variant="link" mt={3} onClick={onClear}>
        Clear list
      </Button>
    </Box>
  );
};

type ItemProps = {
  id: number;
};

const Item = ({ id }: ItemProps) => {
  const [item, setItem] = useRecoilState(itemAtom(id));

  return (
    <Box
      rounded="md"
      textDecoration={item.checked ? 'line-through' : ''}
      opacity={item.checked ? 0.5 : 1}
      _hover={{ textDecoration: 'line-through' }}
      cursor="pointer"
      width="100%"
      onClick={() => setItem({ ...item, checked: !item.checked })}
    >
      {item.label}
    </Box>
  );
};

const NewItemInput = ({ onInsert }: { onInsert: (label: string) => void }) => {
  const [value, setValue] = useState('');

  return (
    <Input
      value={value}
      placeholder="New item"
      padding={0}
      height="auto"
      border="none"
      _focus={{ border: 'none' }}
      _placeholder={{ color: 'rgba(86, 0, 0, 0.48)' }}
      onChange={(e) => {
        setValue(e.currentTarget.value);
      }}
      onKeyPress={({ key }) => {
        if (key === 'Enter') {
          onInsert(value);
          setValue('');
        }
      }}
    />
  );
};
