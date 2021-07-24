import {
  Box,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  NumberInput,
  NumberInputField,
  Switch,
} from '@chakra-ui/react';
import { ArrowRight } from 'react-feather';
import { atom, selector, useRecoilState } from 'recoil';

const exchangeRate = 0.83;

// SINGLE SOURCE OF TRUTH
const usdAtom = atom({
  key: 'usd',
  default: 1,
});

// get한(구독) atom 혹은 다른 selector의 상태가 업데이트될때마다 selector가 반환하는 값도 업데이트됨
// atom을 사용하는 것과 같이 useRecoilValue(only get), useRecoilState(get, set) 사용 가능
// 재사용 가능
// get: return derived data from atom value
// set: set atom value
const eurSelector = selector<number>({
  key: 'eur',

  // if only get, useRecoilValue
  // get 메소드에 전달되는 parameter의 인터페이스
  // {
  //   get: GetRecoilValue;
  //   getCallback: GetCallback;
  // }
  get: ({ get }) => {
    let usd = get(usdAtom);

    const commissionEnabled = get(commissionEnabledAtom);

    // conditionally fetching atom data
    if (commissionEnabled) {
      const commission = get(commissionAtom);
      usd = removeCommission(usd, commission);
    }

    return usd * exchangeRate;
  },
  // settable selector - useRecoilState
  set: ({ set, get }, newEurValue) => {
    // set 메소드에 전될되는 첫 번째 parameter의 인터페이스
    // {
    //   set: SetRecoilState;
    //   get: GetRecoilValue;
    //   reset: ResetRecoilState;
    // }

    // @ts-ignore
    let newUsdValue = newEurValue / exchangeRate;

    const commissionEnabled = get(commissionEnabledAtom);

    // conditionally fetching atom data
    if (commissionEnabled) {
      const commission = get(commissionAtom);
      newUsdValue = removeCommission(newUsdValue, commission);
    }

    set(usdAtom, newUsdValue);
  },
});

export const Selectors = () => {
  const [usd, setUSD] = useRecoilState(usdAtom);
  const [eur, setEUR] = useRecoilState(eurSelector);

  return (
    <div style={{ padding: 20 }}>
      <Heading size="lg" mb={2}>
        Currency converter
      </Heading>
      <InputStack>
        <CurrencyInput label="usd" amount={usd} onChange={(usd) => setUSD(usd)} />
        {/* How do we store this particular value? Can it be stored in recoil state? */}
        <CurrencyInput label="eur" amount={eur} onChange={(eur) => setEUR(eur)} />
      </InputStack>
      <Commission />
    </div>
  );
};

// You can ignore everything below this line.
// It's just a bunch of UI components that we're using in this example.

const InputStack: React.FC = ({ children }) => {
  return (
    <HStack
      width="300px"
      mb={4}
      spacing={4}
      divider={
        <Box border="0 !important" height="40px" alignItems="center" display="flex">
          <Icon as={ArrowRight} />
        </Box>
      }
      align="flex-end"
    >
      {children}
    </HStack>
  );
};

const CurrencyInput = ({
  amount,
  onChange,
  label,
}: {
  label: string;
  amount: number;
  onChange?: (amount: number) => void;
}) => {
  let symbol = label === 'usd' ? '$' : '€';

  return (
    <FormControl id={label.toUpperCase()}>
      <FormLabel>{label.toUpperCase()}</FormLabel>
      <NumberInput
        value={`${symbol} ${amount}`}
        onChange={(value) => {
          const withoutSymbol = value.split(' ')[0];
          onChange?.(parseFloat(withoutSymbol || '0'));
        }}
      >
        <NumberInputField />
      </NumberInput>
    </FormControl>
  );
};

const commissionEnabledAtom = atom({
  key: 'commissionEnabled',
  default: false,
});

const commissionAtom = atom({
  key: 'commission',
  default: 5,
});

const Commission = () => {
  const [enabled, setEnabled] = useRecoilState(commissionEnabledAtom);
  const [commission, setCommission] = useRecoilState(commissionAtom);

  return (
    <Box width="300px">
      <FormControl display="flex" alignItems="center" mb={2}>
        <FormLabel htmlFor="includeCommission" mb="0">
          Include forex commission?
        </FormLabel>
        <Switch
          id="includeCommission"
          isChecked={enabled}
          onChange={(event) => setEnabled(event.currentTarget.checked)}
        />
      </FormControl>
      <NumberInput
        isDisabled={!enabled}
        value={commission}
        onChange={(value) => setCommission(parseFloat(value || '0'))}
      >
        <NumberInputField />
      </NumberInput>
    </Box>
  );
};

// const addCommission = (amount: number, commission: number) => {
//   return amount / (1 - commission / 100);
// };

const removeCommission = (amount: number, commission: number) => {
  return amount * (1 - commission / 100);
};
