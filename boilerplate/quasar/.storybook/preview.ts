import type { Preview } from '@storybook/vue3-vite';
import { Quasar, Notify, Dialog, Loading } from 'quasar';
import '@quasar/extras/material-icons/material-icons.css';
import '@quasar/extras/material-icons-outlined/material-icons-outlined.css';
import '@quasar/extras/fontawesome-v6/fontawesome-v6.css';
import 'quasar/src/css/index.sass';

/**
 * Storybook Preview Configuration
 * 
 * Sets up Quasar framework for all stories.
 */
const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    docs: {
      description: {
        component: 'Quasar Framework components with Clean Architecture patterns.',
      },
    },
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        icon: 'circle_outline',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    /**
     * Quasar decorator - wraps all stories with Quasar provider
     */
    () => ({
      components: { Quasar },
      setup() {
        return () => (
          <Quasar
            plugins={{ Notify, Dialog, Loading }}
            config={{
              notify: { position: 'top-right', timeout: 3000 },
              loading: { spinner: 'QSpinnerGears' },
            }}
          >
            <div style={{ padding: '24px' }}>
              <story />
            </div>
          </Quasar>
        );
      },
    }),
  ],
};

export default preview;
