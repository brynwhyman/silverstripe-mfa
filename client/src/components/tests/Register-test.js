/* global jest, describe, it, expect */

import Complete from '../Register/Complete';

jest.mock('lib/Injector');
jest.mock('../Register/SelectMethod');

// eslint-disable-next-line no-unused-vars
import fetch from 'isomorphic-fetch';
import React from 'react';
import Enzyme, { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import {
  Component as Register,
  SCREEN_REGISTER_METHOD,
  SCREEN_CHOOSE_METHOD,
  SCREEN_COMPLETE
} from '../Register';
import SelectMethod from '../Register/SelectMethod';
import Introduction from '../Register/Introduction';
import { loadComponent } from 'lib/Injector'; // eslint-disable-line

Enzyme.configure({ adapter: new Adapter() });

window.ss = {
  i18n: { _t: (key, string) => string },
};

const endpoints = {
  register: '/fake/{urlSegment}',
  skip: '/fake/skip',
  complete: '/fake/complete',
};

const firstMethod = {
  urlSegment: 'aye',
  name: 'Aye',
  description: 'Register using aye',
  supportLink: 'https://google.com',
  component: 'Test',
};
const mockAvailableMethods = [
  firstMethod,
  {
    urlSegment: 'bee',
    name: 'Bee',
    description: 'Register using bee',
    supportLink: '',
    component: 'Test',
  },
];

const fetchMock = jest.spyOn(global, 'fetch');
const onCompleteRegistration = jest.fn();
const onRemoveAvailableMethod = jest.fn();

describe('Register', () => {
  beforeEach(() => {
    fetchMock.mockImplementation(() => Promise.resolve({
      status: 200,
      json: () => Promise.resolve({}),
    }));
    fetchMock.mockClear();
    loadComponent.mockClear();
    onCompleteRegistration.mockClear();
  });

  describe('setupBackupMethod()', () => {
    it('sets the selected method as the backup method', () => {
      const onSelectMethod = jest.fn();
      const wrapper = shallow(
        <Register
          endpoints={endpoints}
          availableMethods={mockAvailableMethods}
          registeredMethods={[]} // will cause "should set up backup methods" to be true
          selectedMethod={firstMethod}
          backupMethod={{
            name: 'Test',
          }}
          onSelectMethod={onSelectMethod}
          onCompleteRegistration={onCompleteRegistration}
        />
      );

      // Run the handler and check that it's changed to the backup method
      wrapper.instance().setupBackupMethod();
      expect(onSelectMethod).toHaveBeenCalledWith({ name: 'Test' });
    });

    it('clears the selected method and sets to be completed', () => {
      const onSelectMethod = jest.fn();
      const onShowComplete = jest.fn();
      const wrapper = shallow(
        <Register
          endpoints={endpoints}
          availableMethods={mockAvailableMethods}
          registeredMethods={[]}
          backupMethod={null}
          selectedMethod={firstMethod}
          onSelectMethod={onSelectMethod}
          onShowComplete={onShowComplete}
          onCompleteRegistration={onCompleteRegistration}
        />
      );

      // Run the handler and check that it's changed to the backup method
      wrapper.instance().setupBackupMethod();
      expect(onSelectMethod).not.toHaveBeenCalled();
      expect(onShowComplete).toHaveBeenCalled();
    });
  });

  describe('clearRegistrationErrors()', () => {
    it('clears registration errors and registration props', () => {
      const wrapper = shallow(
        <Register
          endpoints={endpoints}
          availableMethods={mockAvailableMethods}
          registeredMethods={[]}
          onCompleteRegistration={onCompleteRegistration}
          onShowChooseMethod={() => {}}
        />
      );

      wrapper.instance().setState({
        registerProps: {
          foo: 'bar',
          error: 'I haven\'nt had my coffee yet!',
        },
      });
      wrapper.instance().handleBack();
      expect(wrapper.instance().state.registerProps).toBeNull();
    });
  });

  describe('fetchStartRegistrationData', () => {
    it('is called when the selected method is changed', done => {
      const wrapper = shallow(
        <Register
          endpoints={endpoints}
          availableMethods={mockAvailableMethods}
          registeredMethods={[]}
          onCompleteRegistration={onCompleteRegistration}
        />
      );

      expect(fetchMock.mock.calls).toHaveLength(0);

      wrapper.setProps({
        selectedMethod: firstMethod,
      }, () => {
        expect(fetchMock.mock.calls).toHaveLength(1);
        expect(fetchMock.mock.calls[0][0]).toBe('/fake/aye');
        done();
      });
    });

    it('stores the response in state', done => {
      const mockResponse = {
        myProp: 1,
        anotherProp: 'two',
      };
      fetchMock.mockImplementation(() => Promise.resolve({
        json: () => Promise.resolve(mockResponse),
      }));

      const wrapper = shallow(
        <Register
          endpoints={endpoints}
          availableMethods={mockAvailableMethods}
          registeredMethods={[]}
          selectedMethod={firstMethod}
          onCompleteRegistration={onCompleteRegistration}
        />
      );

      setTimeout(() => {
        expect(wrapper.state('registerProps')).toEqual(mockResponse);
        done();
      });
    });

    it('stores a CSRF token separately', done => {
      const mockResponse = {
        myProp: 1,
        anotherProp: 'two',
      };
      fetchMock.mockImplementation(() => Promise.resolve({
        json: () => Promise.resolve({ ...mockResponse, SecurityID: 'test' }),
      }));

      const wrapper = shallow(
        <Register
          endpoints={endpoints}
          availableMethods={mockAvailableMethods}
          registeredMethods={[]}
          selectedMethod={firstMethod}
          onCompleteRegistration={onCompleteRegistration}
        />
      );

      setTimeout(() => {
        expect(wrapper.state('registerProps')).toEqual(mockResponse);
        expect(wrapper.state('token')).toBe('test');
        done();
      });
    });
  });

  describe('handleBack()', () => {
    it('unselects the selected method', () => {
      const onShowChooseMethod = jest.fn();
      const wrapper = shallow(
        <Register
          endpoints={endpoints}
          availableMethods={mockAvailableMethods}
          registeredMethods={[]}
          onShowChooseMethod={onShowChooseMethod}
          selectedMethod={firstMethod}
          onCompleteRegistration={onCompleteRegistration}
        />
      );

      wrapper.instance().handleBack();
      expect(onShowChooseMethod).toHaveBeenCalled();
    });
  });

  describe('handleCompleteRegistration()', () => {
    it('will call the "start" endpoint when a method is chosen', done => {
      const wrapper = shallow(
        <Register
          endpoints={endpoints}
          selectedMethod={firstMethod}
          availableMethods={mockAvailableMethods}
          onCompleteRegistration={onCompleteRegistration}
        />,
        { disableLifecycleMethods: true }
      );
      wrapper.instance().handleCompleteRegistration({ myData: 'foo' });

      setTimeout(() => {
        expect(fetchMock.mock.calls).toHaveLength(1);
        const firstCallJson = JSON.stringify(fetchMock.mock.calls[0]);
        expect(firstCallJson).toContain('/fake/aye');
        expect(firstCallJson).toContain('myData');
        expect(firstCallJson).toContain('foo');
        done();
      });
    });
  });

  describe('renderMethod()', () => {
    it('will load the component for the chosen method', done => {
      const wrapper = shallow(
        <Register
          endpoints={endpoints}
          availableMethods={mockAvailableMethods}
          selectedMethod={firstMethod}
          screen={SCREEN_REGISTER_METHOD}
          onCompleteRegistration={onCompleteRegistration}
        />
      );

      setTimeout(() => {
        // "Test" is the name of the specified component, see the definition for "firstMethod"
        expect(wrapper.find('Test')).toHaveLength(1);
        done();
      });
    });

    it('forwards API response as props to injected component', (done) => {
      fetchMock.mockImplementation(() => Promise.resolve({
        json: () => Promise.resolve({
          myProp: 1,
          anotherProp: 'two',
        }),
      }));

      const wrapper = shallow(
        <Register
          endpoints={endpoints}
          availableMethods={mockAvailableMethods}
          selectedMethod={firstMethod}
          screen={SCREEN_REGISTER_METHOD}
          onCompleteRegistration={onCompleteRegistration}
        />
      );

      setTimeout(() => {
        // "Test" is the name of the specified component, see the definition for "firstMethod"
        expect(wrapper.find('Test').props()).toEqual(expect.objectContaining({
          myProp: 1,
          anotherProp: 'two',
        }));
        done();
      });
    });

    it('provides the current method definition to the injected component', (done) => {
      const wrapper = shallow(
        <Register
          endpoints={endpoints}
          availableMethods={mockAvailableMethods}
          selectedMethod={firstMethod}
          screen={SCREEN_REGISTER_METHOD}
          onCompleteRegistration={onCompleteRegistration}
        />
      );

      setTimeout(() => {
        // "Test" is the name of the specified component, see the definition for "firstMethod"
        expect(wrapper.find('Test').props()).toEqual(expect.objectContaining({
          method: firstMethod,
        }));
        done();
      });
    });

    it('calls the API when the complete function is called', done => {
      const wrapper = shallow(
        <Register
          endpoints={endpoints}
          availableMethods={mockAvailableMethods}
          selectedMethod={firstMethod}
          screen={SCREEN_REGISTER_METHOD}
          onCompleteRegistration={onCompleteRegistration}
        />
      );

      setTimeout(() => {
        expect(fetchMock.mock.calls).toHaveLength(1);
        // "Test" is the name of the specified component, see the definition for "firstMethod"
        const completeFunction = wrapper.find('Test').prop('onCompleteRegistration');
        completeFunction({ test: 1 });
        expect(fetchMock.mock.calls).toHaveLength(2);
        expect(fetchMock.mock.calls[1]).toEqual(['/fake/aye', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: '{"test":1}',
        }]);
        done();
      });
    });

    it('shows the complete screen when registration is complete', done => {
      const onShowComplete = jest.fn();

      const wrapper = shallow(
        <Register
          endpoints={endpoints}
          availableMethods={mockAvailableMethods}
          selectedMethod={firstMethod}
          screen={SCREEN_REGISTER_METHOD}
          onCompleteRegistration={onCompleteRegistration}
          onShowComplete={onShowComplete}
          onRemoveAvailableMethod={onRemoveAvailableMethod}
        />
      );

      setTimeout(() => {
        // Expect that a "start" has already been requested
        expect(fetchMock.mock.calls).toHaveLength(1);

        // Mock the next response as a 201 (Created)
        fetchMock.mockReturnValueOnce(Promise.resolve({
          status: 201,
          json: () => Promise.resolve({}),
        }));

        // Trigger a complete on the registration method component
        // "Test" is the name of the specified component, see the definition for "firstMethod"
        const completeFunction = wrapper.find('Test').prop('onCompleteRegistration');
        completeFunction({ test: 1 });
        expect(fetchMock.mock.calls).toHaveLength(2);

        setTimeout(() => {
          expect(onShowComplete).toHaveBeenCalled();
          done();
        });
      });
    });
  });

  describe('renderOptions()', () => {
    it('renders a SelectMethod with available methods to register passed', () => {
      const wrapper = shallow(
        <Register
          endpoints={endpoints}
          availableMethods={mockAvailableMethods}
          screen={SCREEN_CHOOSE_METHOD}
          onCompleteRegistration={onCompleteRegistration}
        />
      );

      const listItems = wrapper.find(SelectMethod);
      const methods = listItems.props().methods;

      expect(methods).toHaveLength(2);
      expect(methods[0].description).toMatch(/Register using aye/);
      expect(methods[1].description).toMatch(/Register using bee/);
    });
  });

  describe('renderIntroduction()', () => {
    it('renders the Introduction UI on first load', () => {
      const wrapper = shallow(
        <Register
          canSkip
          endpoints={endpoints}
          availableMethods={mockAvailableMethods}
          onCompleteRegistration={onCompleteRegistration}
        />
      );

      const introElement = wrapper.find(Introduction);
      expect(introElement).toHaveLength(1);
    });

    it('indicates introduction cannot skip if the skip endpoint is not defined', () => {
      const customEndpoints = {
        ...endpoints,
        skip: null,
      };

      const wrapper = shallow(
        <Register
          canSkip
          endpoints={customEndpoints}
          availableMethods={mockAvailableMethods}
          onCompleteRegistration={onCompleteRegistration}
        />
      );

      const introElement = wrapper.find(Introduction);
      expect(introElement.props().canSkip).toBeFalsy();
    });
  });

  describe('render()', () => {
    it('renders the complete screen', () => {
      const wrapper = shallow(
        <Register
          endpoints={endpoints}
          availableMethods={mockAvailableMethods}
          onCompleteRegistration={onCompleteRegistration}
          screen={SCREEN_COMPLETE}
        />
      );

      expect(wrapper.find(Complete)).toHaveLength(1);
    });

    it('renders the complete screen', () => {
      const wrapper = shallow(
        <Register
          endpoints={endpoints}
          availableMethods={mockAvailableMethods}
          onCompleteRegistration={onCompleteRegistration}
          screen={SCREEN_COMPLETE}
        />
      );

      expect(wrapper.find(Complete)).toHaveLength(1);
    });

    it('renders a button in complete that will trigger onCompleteRegistration', () => {
      const wrapper = shallow(
        <Register
          endpoints={endpoints}
          availableMethods={mockAvailableMethods}
          onCompleteRegistration={onCompleteRegistration}
          screen={SCREEN_COMPLETE}
        />
      );

      const completeWrapper = wrapper.find(Complete).shallow();

      completeWrapper.find('button').simulate('click');

      expect(onCompleteRegistration).toHaveBeenCalled();
    });
  });
});
