# learn-recoil

## 1. Motivation

리액트에서 제공하는 state-management api는 몇가지 문제점이 있다.

- 컴포넌트 상태를 공유하기 위해서는 공통의 상위 컴포넌트에서 state를 prop으로 내려주어야한다. 이때, 컴포넌트 트리에 포함된 다른 컴포넌트에서 불필요한 렌더링이 발생 할 수 있다.
- 위의 문제를 해결하기 위해 context를 사용 할 수 있다. 하지만 context는 하나의 상태만을 관리한다. 만약 context로 관리해야하는 상태가 많아지면, 많아진만큼 context를 생성하거나 하나의 context에 여러 상태를 객체 형태로 묶어서 관리해야한다. 이러한 context를 사용하는 컴포넌트들은 context의 상태 중 필요한 부분만을 사용하며, 그 외 필요하지 않은 상태가 업데이트될 때에도 리렌더링된다.
- 컴포넌트 트리 상단(state가 존재하는 영역)과 하단(state가 사용되는 영역)을 code-split하기 어렵다.

&nbsp;

Recoil은 위 문제를 해결하기 위해 탄생하였으며, Recoil에서 제공하는 api는 최대한 "리액트스럽게" 설계되어있다. Recoil의 특징은 아래와 같다.

- boilerplate-free API: Recoil state는 React local state(ex. useState)와 같이 간단한 get/set 인터페이스를 가진다.
- React의 새로운 기능(ex. Concurrent 모드)과 호환될 수 있다.
- 상태는 확장 가능하며, 컴포넌트에 종속되어있지 않다. 즉, code-split이 가능하다.
- 상태를 기반으로 파생 데이터(derived data)를 생성 할 수 있다.
- 파생 데이터는 비동기적으로 생성될 수 있으며, 이를 사용하는 컴포넌트에 별다른 셋업을 하지 않아도된다.
- 앱에서 사용되는 모든 상태를 쉽게 유지(persist) 할 수 있다.

&nbsp;

## 2. Core Concepts

Recoil state를 사용하기 위해서는 컴포넌트 트리 상단에 `RecoilRoot` 컴포넌트를 추가해야한다.

```tsx
import { RecoilRoot } from 'recoil';

ReactDOM.render(<RecoilRoot>{/* ... */}</RecoilRoot>, document.getElementById('root'));
```

&nbsp;

### Atoms

- 상태의 단위
- 업데이트 될 수 있고, 구독 될 수 있다.
- 새로운 상태로 업데이트되면, 해당 Atom을 구독하는 컴포넌트는 새로운 상태를 가지고 리렌더링된다.
- 동적으로 생성될 수 있다.
- React local state를 사용하는 문맥에서 동일하게 사용될 수 있다.
- 특정 Atom을 구독하는 모든 컴포넌트들은 상태를 공유한다.
- Globally unique key를 가지며, key의 값은 serialize될 수 있어야한다.
- default value가 필요하다.
- atom의 상태를 `useRecoilValue`로 가져올 수 있다.
- atom의 상태와 상태 업데이터를 `useRecoilState`로 가져올 수 있다.
- atom의 상태 업데이터를 `useSetRecoilState`로 가져올 수 있다.

```tsx
import { atom } from 'recoil';

// React Component에 store되지 않는다. 즉, 다른 곳에 작성해도 사용 가능함.
const darkModeState = atom({
  key: 'darkMode', // must be unique, serializable value
  default: false, // default value for state
});
```

```tsx
import { useRecoilState, useRecoilValue } from 'recoil';

const DarkModeSwitch = () => {
  // setDarkMode는 darkModeState를 update
  const [darkMode, setDarkMode] = useRecoilState(darkModeState);

  return <input type="checkbox" checked={darkMode} onChange={(event) => setDarkMode(event.currentTarget.checked)} />;
};

const Text = () => {
  // atom의 value만 필요하다면 useRecoilValue 사용
  // atom state updater만 필요하다면 useSetRecoilState 사용
  const darkMode = useRecoilValue(darkModeState);

  return (
    <button
      style={{
        backgroundColor: darkMode ? 'black' : 'white',
        color: darkMode ? 'white' : 'black',
      }}
    >
      My UI Button
    </button>
  );
};

export const AtomExample = () => {
  return (
    <div>
      <DarkModeSwitch />
      <Text />
    </div>
  );
};
```

&nbsp;

### Selectors

- atom 혹은 selector로부터 파생된 데이터의 단위(**pure function**)
- 업데이트 될 수 있고, 구독 될 수 있다.
- 새로운 상태로 업데이트되면, 해당 selector를 구독하는 컴포넌트는 새로운 상태를 가지고 리렌더링된다.
- React local state를 사용하는 문맥에서 동일하게 사용될 수 있다.
- Globally unique key를 가지며, key의 값은 serialize될 수 있어야한다.
- get(must), set(optional) 메소드를 정의 할 수 있다.
- selector의 데이터를 `useRecoilValue`로 가져올 수 있다.
- selector의 데이터와 데이터 업데이터를 `useRecoilState`로 가져올 수 있다. (set 메소드가 작성되어 있는 selector만 해당)
- selector의 상태 업데이터를 `useSetRecoilState`로 가져올 수 있다.

```tsx
import { atom, selector, useRecoilState } from 'recoil';

// 달러 -> 유로 환률
const exchangeRate = 0.83;

// SINGLE SOURCE OF TRUTH
const usdState = atom({
  key: 'usd',
  default: 1,
});

// get한 atom 혹은 다른 selector의 상태가 업데이트 될 때 selector가 반환하는 값도 업데이트됨
// get: return derived data from atom/selector value
// set: set atom/selector value
const eurState = selector<number>({
  key: 'eur',
  get: ({ get }) => {
    // 달러 정보를 구독
    const usd = get(usdState);

    // 달러 정보를 기반으로 파생 데이터 생성
    return usd * exchangeRate;
  },
  set: ({ set }, newEurValue) => {
    // 전달된 유로 값으로 새로운 달러 정보를 계산
    const newUsdValue = newEurValue / exchangeRate;

    // 달러 정보를 업데이트 -> 위의 get에서 구독한 달러 정보가 업데이트되기 때문에 selector의 값이 재평가
    set(usdState, newUsdValue);
  },
});

export const SelectorExample = () => {
  const [usd, setUSD] = useRecoilState(usdState);
  const [eur, setEUR] = useRecoilState(eurState);

  return (
    <div>
      <CurrencyInput label="usd" amount={usd} onChange={(usd) => setUSD(usd)} />
      <CurrencyInput label="eur" amount={eur} onChange={(eur) => setEUR(eur)} />
    </div>
  );
};
```

&nbsp;

### AtomFamily

여러 아이템에 대한 상태를 하나의 Context로 관리하면, 각 아이템에 대한 상태를 isolate 시킬 수 없다. 즉, 하나의 아이템에 대한 상태를 업데이트하면, 모든 아이템의 상태도 업데이트된다 (불필요한 렌더링 발생). `atomFamily`를 사용하면 각 아이템에 대한 atom이 생성되며, 해당 아이템이 업데이트 될 경우, 그 아이템의 상태를 구독하는 컴포넌트만 업데이트, 리렌더링된다.

- elementAtom(1) -> atom for element 1
- elementAtom(2) -> atom for element 2
- elementAtom(3) -> atom for element 3
- elementAtom(4) -> atom for element 4

```tsx
import { atomFamily } from 'recoil';

// 각 요소의 상태 - elementState(id: number)
export const elementState = atomFamily<Element, number>({
  key: 'element',
  default: {
    style: {
      position: {
        top: 0,
        left: 0,
      },
      size: {
        width: 200,
        height: 200,
      },
    },
  },
});

const AtomFamilyExample = ({ id }: { id: number }) => {
  // atom family 중 prop.id에 해당하는 atom state와 state updater를 가져옴
  const [element, setElement] = useRecoilState(elementState(id));

  return (
    <RectangleContainer position={element.style.position} size={element.style.size}>
      <Resize
        position={element.style.position}
        size={element.style.size}
        onResize={(style) => {
          setElement({
            ...element,
            style,
          });
        }}
      />
    </RectangleContainer>
  );
};
```

&nbsp;

### SelectorFamily

일반 `selector` 사용 시 parameter를 전달 할 수 없다. 비슷한 데이터를 get, set하지만 parametar에 따라 동작 여부가 조금씩 달라질 때 `selectorFamily`를 사용 할 수 있다.

```tsx
import { atom, atomFamily, selector, selectorFamily } from 'recoil';
import _ from 'lodash';
import produce from 'immer';

// 선택된 요소의 id
export const selectedElementIdState = atom<number | null>({
  key: 'selectedElementId',
  default: null,
});

// 각 요소의 상태 - elementState(id: number)
export const elementState = atomFamily<Element, number>({
  key: 'element',
  default: {
    style: {
      position: {
        top: 0,
        left: 0,
      },
      size: {
        width: 200,
        height: 200,
      },
    },
  },
});

/**
 * selectedElementId에 해당하는 요소만 get, set
 * 문제점: 선택된 요소의 부분적 정보를 get, set 할 수 없다.
 */
export const selectedElementState = selector<Element | undefined>({
  key: 'selectedElement',
  get: ({ get }) => {
    const selectedElementId = get(selectedElementIdState);
    if (selectedElementId == null) return;

    return get(elementState(selectedElementId));
  },
  set: ({ get, set }, newElement) => {
    const selectedElementId = get(selectedElementIdState);
    if (selectedElementId == null) return;
    if (!newElement) return;

    // selectedElement의 id를 사용하여, atomFamily 중 해당 id에 부합하는 atom의 상태를 update
    set(elementState(selectedElementId), newElement);
  },
});
```

```tsx
// selectorFamily를 사용하여 위 selectedElementState를 보완
export const elementPropsState = selectorFamily<
  any,
  {
    propPath: string;
    id: number;
  }
>({
  key: 'elementProps',
  get:
    (params) =>
    ({ get }) => {
      // propPath와 요소의 id를 전달 받는다.
      const { propPath, id } = params;

      // 전달된 id에 해당하는 요소 정보를 취득한다.
      const element = get(elementAtom(id));

      // 전달된 propPath에 해당하는 값을 반환한다.
      return _.get(element, propPath);
    },
  set:
    (params) =>
    ({ get, set }, newValue) => {
      // propPath와 요소의 id를 전달 받는다.
      const { propPath, id } = params;

      // 전달된 id에 해당하는 요소 정보를 취득한다.
      const element = get(elementAtom(id));

      const newElement = produce(element, (draft) => {
        _.set(draft, propPath, newValue);
      });

      // 전달된 id에 해당하는 요소 정보를 업데이트한다.
      set(elementAtom(id), newElement);
    },
});
```

&nbsp;

### Async Selector

파생 데이터는 비동기적으로 생성될 수 있다. 즉, `selector`의 `get` 메소드는 비동기 로직을 포함 할 수 있다. 단, selector는 pure function이기 때문에 fetch한 데이터는 input(ex. 다른 atom, selector의 상태)이 같을 때 같은 데이터를 반환해야한다.

async selector는 `selector` 혹은 `selectorFamily`를 통해 구현 할 수 있다. 하지만 사용되는 시점이 다르다.

| Derived Data From                            | API            |
| -------------------------------------------- | -------------- |
| atom 혹은 selector                           | selector       |
| props로 전달되는 값 (ex. redux, react state) | selectorFamily |
| Both                                         | selectorFamily |

```tsx
const userSelector = selectorFamily({
  key: 'user',
  // selector는 최초 반환한 값을 자동으로 캐싱한다. 따라서, userId = 1을 2번 요청하면, 2번째 요청은 최초 캐시된 데이터로 대체된다 (요청 X)
  // race condition을 자동으로 처리한다 (ex. fetch user1 -> fetch user2 -> fetching user1 cancelled)
  get: (userId: number) => async () => {
    // Uncaught Error: Async suspended while rendering, but no fallback UI was specified.
    // async state를 사용하는 컴포넌트는 Suspense 컴포넌트로 감싸주어야한다.
    const userData = await fetch(`https://jsonplaceholder.typicode.com/users/${userId}`).then((response) =>
      response.json(),
    );

    // 만약 요청에 실패 할 경우 어떻게 되는가? - ErrorBoundary 사용
    if (userId === 4) {
      throw new Error('User does not exist');
    }

    return userData;
  },
});
```

```tsx
// Suspense 사용 시 컴포넌트 자체를 감싸야함
// async selector가 2개 이상이어도 Suspense 컴포넌트 안에 위치한다면,
// 2개 이상의 비동기 요청이 성공 할 때까지 fallback 컴포넌트를 표시
const UserData = ({ userId }: { userId: number }) => {
  const user = useRecoilValue(userSelector(userId));

  return (
    <div>
      <Heading as="h2" size="md" mb={1}>
        User data:
      </Heading>
      <Text>
        <b>Name:</b> {user.name}
      </Text>
      <Text>
        <b>Phone:</b> {user.phone}
      </Text>
      <Suspense fallback={<div>Loading Weather...</div>}>
        <UserWeather userId={userId} />
      </Suspense>
    </div>
  );
};

const ErrorFallBack = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <div>
      <Heading as="h2" size="md" mb={1}>
        Something went wrong
      </Heading>
      <Text>{error.message}</Text>
      {/* resetErrorBoundary 호출 시 에러가 발생한 컴포넌트를 다시 렌더링한다. */}
      <Button onClick={resetErrorBoundary}>OK</Button>
    </div>
  );
};

export const Async = ({ id }: { id: number }) => {
  return (
    <>
      {userId !== undefined && (
        // Error 발생 시 ErrorBoundary 하위 컴포넌트만 unmount되고, fallback 컴포넌트가 렌더된다.
        <ErrorBoundary
          FallbackComponent={ErrorFallBack}
          onReset={() => {
            // resetErrorBoundary 호출 시 onReset 함수 호출. 사용자가 선택되어있지 않은 상태로 복구
            setUserId(undefined);
          }}
          // restKeys에 전달한 key 목록의 아이템 값이 변경되면 ErrorBoundary 하위의 컴포넌트를 remount 시도한다.
          resetKeys={[userId]}
        >
          <Suspense fallback={<div>Loading...</div>}>
            <UserData userId={userId} />
          </Suspense>
        </ErrorBoundary>
      )}
    </>
  );
};
```

&nbsp;
