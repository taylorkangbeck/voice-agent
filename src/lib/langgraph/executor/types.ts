export type Flow = {
  id: string;
  name: string;
  description: string;
  context?: Record<string, any>;
  steps: FlowStep<any, any>[];
};

export type FlowStep<ActionInput, ActionOutput> = {
  id: string;
  name: string;
  instructions: string;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
  context?: Record<string, any>;
  action: (input: ActionInput) => Promise<ActionOutput>;
  execution?: FlowStepExecution<ActionInput, ActionOutput>;
};

export type FlowExecution = {
  flow: Flow;
  steps: FlowStepExecution<any, any>[];
};

export type FlowStepExecution<ActionInput, ActionOutput> = {
  step: FlowStep<ActionInput, ActionOutput>;
  result?: ActionOutput;
  error?: string;
};
