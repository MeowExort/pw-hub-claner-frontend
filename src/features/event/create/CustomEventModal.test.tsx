import {describe, it} from 'vitest';
import {render} from '@/shared/lib/test-utils';
import CustomEventModal from './CustomEventModal';

describe('CustomEventModal', () => {
    it('renders without crashing', () => {
        render(<CustomEventModal onClose={() => {
        }}/>);
    });
});