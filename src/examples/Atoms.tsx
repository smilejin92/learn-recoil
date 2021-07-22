import { atom, useRecoilState, useRecoilValue } from 'recoil';

/**
 * React Component에 store되지 않는다. 즉, 다른 곳에 작성해도 사용 가능
 * 2개의 useState가 linked-up together되어 있다고 생각하면 편함
 */
const darkModeAtom = atom({
  /**
   * key labels this specific atom (persister에서도 사용)
   * must be serializable value and unique
   */
  key: 'darkMode',
  // default value of this atom
  default: false,
});

const DarkModeSwitch = () => {
  // setDarkMode는 darkModeAtom의 value를 update
  const [darkMode, setDarkMode] = useRecoilState(darkModeAtom);

  return (
    <input
      type="checkbox"
      checked={darkMode}
      onChange={(event) => setDarkMode(event.currentTarget.checked)}
    />
  );
};

const Button = () => {
  // atom의 value만 필요하다면 useRecoilValue만 사용 가능
  const darkMode = useRecoilValue(darkModeAtom);

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

export const Atoms = () => {
  return (
    <div>
      <div>
        <DarkModeSwitch />
      </div>
      <div>
        <Button />
      </div>
    </div>
  );
};
