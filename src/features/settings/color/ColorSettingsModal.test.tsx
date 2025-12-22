import {describe, it} from 'vitest';
import {render} from '@/shared/lib/test-utils';
import ColorSettingsModal from './ColorSettingsModal';

describe('ColorSettingsModal', () => {
    it('renders without crashing', () => {
        render(<ColorSettingsModal onClose={() => {
        }}/>);
    });
});