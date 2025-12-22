import {describe, it} from 'vitest';
import {render} from '@/shared/lib/test-utils';
import CharacterCreationPage from './CharacterCreationPage';

describe('CharacterCreationPage', () => {
    it('renders without crashing', () => {
        render(<CharacterCreationPage/>);
    });
});