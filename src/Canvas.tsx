import { useRecoilValue, useSetRecoilState } from 'recoil';
import { elementIdsAtom, selectedElementIdAtom } from './atoms';
import { Rectangle } from './components/Rectangle/Rectangle';
import { EditProperties } from './EditProperties';
import { PageContainer } from './PageContainer';
import { Toolbar } from './Toolbar';

function Canvas() {
  const setSelectedElement = useSetRecoilState(selectedElementIdAtom);
  const elementIds = useRecoilValue(elementIdsAtom);

  return (
    <PageContainer
      onClick={() => {
        setSelectedElement(null);
      }}
    >
      <Toolbar />
      <EditProperties />
      {elementIds.map((id) => (
        <Rectangle key={id} id={id} />
      ))}
    </PageContainer>
  );
}

export default Canvas;
