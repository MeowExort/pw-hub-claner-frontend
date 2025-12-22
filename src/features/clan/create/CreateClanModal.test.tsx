import {describe, it} from 'vitest';
import {render} from '@/shared/lib/test-utils';
import CreateClanModal from './CreateClanModal';

describe('CreateClanModal', () => {
    it('renders without crashing', () => {
        render(<CreateClanModal onClose={() => {
        }}/>);
    });
});