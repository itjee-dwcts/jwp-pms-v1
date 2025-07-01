import { Menu, Transition } from '@headlessui/react';
import classNames from 'classnames';
import React, { Fragment } from 'react';

/**
 * 타입 정의
 */
interface DropdownMenuItemObject {
  label: string;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

interface DividerItem {
  type: 'divider';
}

type DropdownItem = DropdownMenuItemObject | DividerItem;

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  position?: 'left' | 'right';
  menuWidth?: string;
}

/**
 * DropdownMenu Component
 *
 * Headless UI와 Tailwind CSS를 사용하여 재사용 가능하고 접근성 높은 드롭다운 메뉴를 제공합니다.
 */
export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  items,
  position = 'right',
  menuWidth = 'w-56',
}) => {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button as="div" className="inline-flex">
          {trigger}
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={classNames(
            'absolute z-10 mt-2 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-200 dark:border-gray-700',
            menuWidth,
            {
              'origin-top-right right-0': position === 'right',
              'origin-top-left left-0': position === 'left',
            }
          )}
        >
          <div className="py-1">
            {items.map((item, index) => {
              if ('type' in item && item.type === 'divider') {
                return <div key={`divider-${index}`} className="my-1 h-px bg-gray-200 dark:bg-gray-700" />;
              }

              const { label, onClick, icon: Icon, className: itemClassName } = item as DropdownMenuItemObject;

              return (
                <Menu.Item key={label}>
                  {({ active }) => (
                    <button
                      onClick={onClick}
                      className={classNames(
                        'w-full text-left flex items-center px-4 py-2 text-sm',
                        {
                          'bg-gray-100 dark:bg-gray-700': active,
                          'text-gray-700 dark:text-gray-300': !itemClassName,
                        },
                        itemClassName
                      )}
                    >
                      {Icon && <Icon className="mr-3 h-4 w-4" aria-hidden="true" />}
                      {label}
                    </button>
                  )}
                </Menu.Item>
              );
            })}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default DropdownMenu;
