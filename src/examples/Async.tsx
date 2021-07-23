import { Container, Heading, Text } from '@chakra-ui/layout';
import { Select } from '@chakra-ui/select';
import { Suspense, useState } from 'react';
import { selectorFamily, useRecoilValue } from 'recoil';

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

    return userData;
  },
});

// Suspense 사용 시 컴포넌트 자체를 감싸야함
// async selector를 사용하는 컴포넌트는 Suspense로 감싸야함 (MUST)
const UserData = ({ userId }: { userId: number }) => {
  const user = useRecoilValue(userState(userId));

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
      </Select>
      {userId !== undefined && (
        <Suspense fallback={<div>Loading...</div>}>
          <UserData userId={userId} />
        </Suspense>
      )}
    </Container>
  );
};
