export type JiraIssue = {
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
    };
    priority?: {
      name: string;
    } | null;
  };
};

export type JiraSearchResponse = {
  issues?: JiraIssue[];
};

export type TeamsMessagePayload = {
  title: string;
  text: string;
  message: string;
};

export type JobResult = {
  shouldSendMessage: boolean;
  message?: string;
  newIssues: JiraIssue[];
};
