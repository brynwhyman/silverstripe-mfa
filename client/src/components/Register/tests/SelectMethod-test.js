/* global jest, describe, it, expect */

import React from 'react';
import Enzyme, { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { Component as SelectMethod } from '../SelectMethod';

jest.mock('../MethodTile');

Enzyme.configure({ adapter: new Adapter() });

window.ss = {
  i18n: { _t: (key, string) => string },
};

const selectMethodMock = jest.fn();

const firstMethod = {
  urlSegment: 'aye',
  name: 'Aye',
  description: 'Register using aye',
  supportLink: 'https://google.com',
  component: 'Test',
};

describe('SelectMethod', () => {
  it('automatically selects the only available method', () => {
    const mockNextHandler = jest.fn();
    shallow(
      <SelectMethod
        methods={[firstMethod]}
        isAvailable={() => true}
        onSelectMethod={mockNextHandler}
      />
    );

    expect(mockNextHandler).toHaveBeenCalledTimes(1);
  });

  it('does not automatically select the only available method when not usable', () => {
    const mockNextHandler = jest.fn();
    shallow(
      <SelectMethod
        methods={[firstMethod]}
        isAvailable={() => false}
        onSelectMethod={mockNextHandler}
      />
    );

    expect(mockNextHandler).toHaveBeenCalledTimes(0);
  });

  describe('handleGoToNext()', () => {
    it('passes the highlighted method to the method selection handler', () => {
      const wrapper = shallow(
        <SelectMethod
          methods={[]}
          onSelectMethod={(method) => {
            expect(method.description).toBe('my mock method');
          }}
        />
      );
      wrapper.setState({ highlightedMethod: { description: 'my mock method' } });
      wrapper.instance().handleGoToNext();
    });
  });

  describe('handleBack()', () => {
    it('has a todo alert', () => {
      window.alert = (message) => {
        expect(message).toContain('Todo');
      };
      const wrapper = shallow(
        <SelectMethod
          methods={[]}
          onSelectMethod={selectMethodMock}
        />
      );
      wrapper.instance().handleBack();
    });
  });

  describe('renderActions()', () => {
    it('renders a "Next" button', () => {
      const wrapper = shallow(
        <SelectMethod
          methods={[]}
          onSelectMethod={selectMethodMock}
        />
      );

      const button = wrapper.find('.mfa-action-list .btn').first();
      expect(button.text()).toBe('Next');
    });

    it('renders a "Next" button in a disabled state when no method is highlighted', () => {
      const wrapper = shallow(
        <SelectMethod
          methods={[]}
          onSelectMethod={selectMethodMock}
        />
      );

      const button = wrapper.find('.mfa-action-list .btn').first();
      expect(button.props().disabled).toBe(true);
    });

    it('renders an active "Next" button when a method is highlighted', () => {
      const wrapper = shallow(
        <SelectMethod
          methods={[firstMethod]}
          onSelectMethod={selectMethodMock}
        />
      );
      wrapper.instance().handleClick(firstMethod);

      const button = wrapper.find('.mfa-action-list .btn').first();
      expect(button.props().disabled).toBe(false);
    });

    it('renders a "Back" button', () => {
      const wrapper = shallow(
        <SelectMethod
          methods={[]}
          onSelectMethod={selectMethodMock}
        />
      );

      const button = wrapper.find('.mfa-action-list .btn').at(1);
      expect(button.text()).toBe('Back');
    });
  });

  describe('render()', () => {
    it('renders a MethodTile component for each available method', () => {
      const wrapper = shallow(
        <SelectMethod
          methods={[firstMethod]}
          onSelectMethod={selectMethodMock}
        />
      );

      expect(wrapper.find('.mfa-method-tile__container')).toHaveLength(1);
      expect(wrapper.find('.mfa-method-tile__container').children()).toHaveLength(1);
    });
  });
});
