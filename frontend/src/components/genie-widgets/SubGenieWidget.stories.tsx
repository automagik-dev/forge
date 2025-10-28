import type { Meta, StoryObj } from '@storybook/react';
import { Sparkles, Hammer, Target, ZapOff, AlertCircle } from 'lucide-react';
import { SubGenieWidget } from './SubGenieWidget';
import { SubGenieConfig } from './types';

const wishConfig: SubGenieConfig = {
  id: 'wish',
  name: 'Wish',
  columnStatus: 'todo',
  icon: Sparkles,
  color: 'purple',
  workflows: [
    {
      id: 'refine_spec',
      label: 'Refine Spec',
      description: 'Refine task specification',
      genieType: 'wish',
      columnStatus: 'todo',
    },
    {
      id: 'analyze_deps',
      label: 'Analyze Dependencies',
      description: 'Identify task dependencies',
      genieType: 'wish',
      columnStatus: 'todo',
    },
  ],
  skills: [
    {
      id: 'quick_analysis',
      name: 'Quick Analysis',
      description: 'Fast mode (skip deep analysis)',
      icon: ZapOff,
      genieType: 'wish',
    },
  ],
};

const meta: Meta<typeof SubGenieWidget> = {
  component: SubGenieWidget,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WishOpen: Story = {
  args: {
    config: wishConfig,
    isOpen: true,
    onClose: () => {},
    onSendMessage: (msg) => console.log('Message:', msg),
    onWorkflowClick: (id) => console.log('Workflow:', id),
    onSkillToggle: (id, enabled) => console.log('Skill:', id, enabled),
    chatHistory: [
      {
        id: '1',
        sender: 'user',
        content: 'Can you refine the spec for this task?',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        sender: 'wish',
        content: 'Of course! I\'ve analyzed the requirements and updated the spec.',
        timestamp: new Date().toISOString(),
      },
    ],
    skillsState: { quick_analysis: false },
  },
};

export const WishClosed: Story = {
  args: {
    ...WishOpen.args,
    isOpen: false,
  },
};

export const WishLoading: Story = {
  args: {
    ...WishOpen.args,
    isLoading: true,
  },
};
