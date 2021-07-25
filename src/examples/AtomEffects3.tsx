import { Button } from '@chakra-ui/button';
import { Input } from '@chakra-ui/input';
import { Box, Divider, Heading, VStack } from '@chakra-ui/layout';
import React, { useState } from 'react';
import {
  atom,
  atomFamily,
  DefaultValue,
  useRecoilCallback,
  useRecoilState,
  useRecoilValue,
  useResetRecoilState,
} from 'recoil';
import { shoppingListAPI } from './fakeAPI';

type ItemType = {
  label: string;
  checked: boolean;
};

/**
 * how to persist atomFamily data back to API?
 * use atom effect api
 * 1개 이상의 effect를 배열로 전달. 전달된 effect는 "하나의" atom state initialize(ex. 새로고침), update 시 호출됨
 * 비동기 effect를 사용하는 atomState를 사용하는 컴포넌트는, Suspense 컴포넌트로 감싸주어야한다.
 * 문제점: itemIds 요청 후, 각 item 상세 정보를 요청한다. (1 + n)
 */
const itemIdsAtom = atom<number[]>({
  key: 'ids',
  default: [],
  effects_UNSTABLE: [
    /**
     * atom effect has to be a void function.
     * 요청한 데이터로 setSelf를 호출하려면 Promise를 전달한다.
     * AtomEffect는 전달된 Promise가 resolve될 때까지 대기 한 후 setSelf한다.
     */
    ({ setSelf }) => {
      // TODO: Fetch a list of item ids from the server
      const itemsIdPromise = shoppingListAPI.getItems().then((items) => Object.keys(items).map((id) => parseInt(id)));
      setSelf(itemsIdPromise);
    },
  ],
});

const itemAtom = atomFamily<ItemType, number>({
  key: 'item',
  default: { label: '', checked: false },
  // effects에 전달되는 것이 배열이 아니라 배열을 리턴하는 함수라면,
  // 매개변수로 해당 atom의 param(여기선 id)을 전달 받을 수 있다.
  effects_UNSTABLE: (id) => [
    ({ onSet, setSelf }) => {
      // TODO:
      // 1. Fetch individual item data from the API and initialise the atoms
      // 2. Update/create individual item data via the API
      const itemPromise = shoppingListAPI.getItem(id).then((item) => {
        if (item === undefined) return new DefaultValue();
        else return item;
      });

      setSelf(itemPromise);

      onSet((newItem) => {
        if (newItem instanceof DefaultValue) {
          shoppingListAPI.deleteItem(id);
        } else {
          shoppingListAPI.createOrUpdateItem(id, newItem);
        }
      });
    },
  ],
});

export const AtomEffects3 = () => {
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
