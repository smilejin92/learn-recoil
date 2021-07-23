import { Container, Heading, Text } from '@chakra-ui/layout';
import { Button } from '@chakra-ui/react';
import { Select } from '@chakra-ui/select';
import { Suspense, useState } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import {
  atomFamily,
  selectorFamily,
  useRecoilValue,
  useSetRecoilState,
} from 'recoil';
import { getWeather } from './fakeAPI';

/**
 * selector vs. selectorFamily
 * | derived data from  |       API       |
 * ----------------------------------------
 * | atom / selector    |    selector     |
 * | redux, react state |  selectorFamily |
 * | Both               |  selectorFamily |
 */

// atom을 사용한 state가 아니라면(ex. redux state, react state) selectorFamily의 params로 전달 할 수 있다.
const userState = selectorFamily({
  key: 'user',
  // async selector는 최초 반환한 값을 자동으로 캐싱한다. 따라서, userId = 1을 2번 요청하면, 2번째 요청은 최초 캐시된 데이터로 대체된다 (요청 X)
  // race condition을 자동으로 처리한다 (ex. fetch user1 -> fetch user2 -> fetching user1 cancelled)
  get: (userId: number) => async () => {
    // Uncaught Error: Async suspended while rendering, but no fallback UI was specified.
    const userData = await fetch(
      `https://jsonplaceholder.typicode.com/users/${userId}`,
    ).then((response) => response.json());

    // 만약 요청에 실패 할 경우 어떻게 되는가? - ErrorBoundary 사용
    if (userId === 4) {
      throw new Error('User does not exist');
    }

    return userData;
  },
});

const weatherRequestIdState = atomFamily({
  key: 'weatherRequestId',
  default: 0,
});

const useRefetchWeather = (userId: number) => {
  const setWeatherRequestId = useSetRecoilState(weatherRequestIdState(userId));
  return () => {
    setWeatherRequestId((id) => id + 1);
  };
};

// depends on userState (above)
// 만약 refetch해야 할 경우 requestId 디펜던시를 추가하여 requestId가 바뀔 때, refetch될 수 있도록 한다
const weatherState = selectorFamily({
  key: 'weather',
  get:
    (userId: number) =>
    async ({ get }) => {
      // refetch를 위해 dependency 추가
      get(weatherRequestIdState(userId));

      // userState selector는 async 함수이지만, 이 곳에서 await하지 않는다.
      // recoil은 userState가 response를 resolve 할 때까지 기다린 후 이 곳에서 사용한다.
      const user = get(userState(userId)); // userState

      const weather = await getWeather(user.address.city);
      return weather;
    },
});

const UserWeather = ({ userId }: { userId: number }) => {
  // recoil state를 중복으로 subscribe해도 문제가 없다.
  // async selector의 경우 중복 요청이 아닌 캐시된 데이터를 사용한다.
  const user = useRecoilValue(userState(userId));
  const weather = useRecoilValue(weatherState(userId));
  const refetchWeather = useRefetchWeather(userId);

  return (
    <div>
      <Text>
        <b>Weather for {user.address.city}:</b> {weather}
      </Text>
      <Text onClick={refetchWeather}>(refresh weather)</Text>
    </div>
  );
};

// Suspense 사용 시 컴포넌트 자체를 감싸야함
// async selector를 사용하는 컴포넌트는 Suspense로 감싸야함 (MUST)
// async selector가 2개 이상이어도 Suspense 컴포넌트 안에 위치한다면,
// 2개 이상의 비동기 요청이 성공 할 때까지 fallback 컴포넌트를 표시
const UserData = ({ userId }: { userId: number }) => {
  // userState와 weatherState 모두 userData를 fetch하지만, 실질적으로 요청은 1회 발생한다.
  // userState에서 데이터를 fetch해오면, weatherState에서 캐싱된 데이터를 사용한다.
  const user = useRecoilValue(userState(userId)); // error 발생 시 error가 throw된다.
  // const weather = useRecoilValue(weatherState(userId));

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

export const Async = () => {
  const [userId, setUserId] = useState<undefined | number>(undefined);

  return (
    <Container py={10}>
      <Heading as="h1" mb={4}>
        View Profile
      </Heading>
      <Heading as="h2" size="md" mb={1}>
        Choose a user:
      </Heading>
      <Select
        placeholder="Choose a user"
        mb={4}
        value={userId}
        onChange={(event) => {
          const value = event.target.value;
          setUserId(value ? parseInt(value) : undefined);
        }}
      >
        <option value="1">User 1</option>
        <option value="2">User 2</option>
        <option value="3">User 3</option>
        <option value="4">User 4</option>
      </Select>
      {userId !== undefined && (
        // Error 발생 시 ErrorBoundary 하위의 컴포넌트만 unmount되고, fallback 컴포넌트가 렌더된다.
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
    </Container>
  );
};
