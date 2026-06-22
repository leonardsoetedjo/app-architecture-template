import React, { Suspense } from 'react';
import { Provider } from 'react-redux';
import { store } from 'app/store';
import { AppRouter } from 'app/router';
import { AppLayout } from 'shared/ui/templates/AppLayout';

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppLayout>
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-screen text-gray-400">
              Loading…
            </div>
          }
        >
          <AppRouter />
        </Suspense>
      </AppLayout>
    </Provider>
  );
};

export default App;
