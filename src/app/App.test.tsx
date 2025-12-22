import {describe, it} from 'vitest';
import {render} from '@/shared/lib/test-utils';
import App from './App';

describe('App', () => {
    it('renders without crashing', () => {
        render(<App/>);
    });
});