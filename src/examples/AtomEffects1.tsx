import { Button } from '@chakra-ui/button';
import { Input } from '@chakra-ui/input';
import { Box, Divider, Heading, VStack } from '@chakra-ui/layout';
import produce from 'immer';
import React, { useState } from 'react';
import { atom, DefaultValue, useRecoilState, useResetRecoilState } from 'recoil';

type ItemType = {
  label: string;
  checked: boolean;
};

// contains shopping items list
const shoppingItemsAtom = atom<ItemType[]>({
  key: 'shoppingItems',
  default: [],
  /**
   * how to persist atom data back to localStorage?
   * use atom effect api
   * 1개 이상의 effect를 배열로 전달. 전달된 effect는 state initialize(ex. 새로고침), update 시 호출됨
   */
  effects_UNSTABLE: [
    ({ onSet, setSelf }) => {
      const storedData = localStorage.getItem('shoppingItems');

      if (storedData !== null) {
        // stored된 데이터가 있다면, 해당 데이터로 state initialize
        setSelf(JSON.parse(storedData));
        // Calling setSelf() from the effect will initialize the atom to that value and will be used for the initial render.
      }

      /**
       * 주의: onSet 함수에 전달된 newState의 타입이 atom의 default value 타입(ItemType[])이 아닐 수 있다.
       * DefaultValue 타입은 useResetRocilState hook과 같이 state를 reset 시킬 때 전달되는 newState의 타입이다.
       * 따라서 해당 경우를 핸들링 해주어야한다.
       */
      onSet((newShoppingItems) => {
        if (newShoppingItems instanceof DefaultValue) {
          localStorage.removeItem('shoppingItems');
        } else {
          localStorage.setItem('shoppingItems', JSON.stringify(newShoppingItems));
        }
      });
    },
  ],
});

export const AtomEffects1 = () => {
  const [items, setItems] = useRecoilState(shoppingItemsAtom);
  const resetList = useResetRecoilState(shoppingItemsAtom);

  const toggleItem = (index: number) => {
    setItems(
      produce(items, (draftItems) => {
        draftItems[index].checked = !draftItems[index].checked;
      }),
    );
  };

  const insertItem = (label: string) => {
    setItems([...items, { label, checked: false }]);
  };

  return (
    <Container onClear={() => resetList()}>
      {items.map((item, index) => (
        <Item
          key={item.label}
          label={item.label}
          checked={item.checked}
          onClick={() => {
            toggleItem(index);
          }}
        />
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
  label: string;
  checked: boolean;
  onClick: () => void;
};

const Item = ({ label, checked, onClick }: ItemProps) => {
  return (
    <Box
      rounded="md"
      textDecoration={checked ? 'line-through' : ''}
      opacity={checked ? 0.5 : 1}
      _hover={{ textDecoration: 'line-through' }}
      cursor="pointer"
      width="100%"
      onClick={onClick}
    >
      {label}
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
