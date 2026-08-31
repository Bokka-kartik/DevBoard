import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import CardModal from "../../components/CardModal";
import type { CardData, Member } from "../../components/CardModal";
import { MockedProvider } from "@apollo/client/testing";
import { UPDATE_CARD } from "../../graphql/operations";
import { mockUser } from "../fixtures/data";

const mockCard: CardData = {
  id: "card-1",
  title: "Fix the bug",
  description: "It crashes on login",
  labels: ["urgent"],
  dueDate: "2026-12-31T00:00:00.000Z",
  assignee: mockUser,
};

const mockMembers: Member[] = [{ user: mockUser, role: "owner" }];

const renderModal = (mocks: any[] = [], cardOverrides = {}) => {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  const onDelete = vi.fn();

  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <CardModal
        card={{ ...mockCard, ...cardOverrides }}
        members={mockMembers}
        onClose={onClose}
        onSaved={onSaved}
        onDelete={onDelete}
      />
    </MockedProvider>
  );

  return { onClose, onSaved, onDelete };
};

describe("CardModal — behaviour", () => {
  it("pre-fills all existing card values into the form", () => {
    renderModal();
    expect((screen.getByDisplayValue("Fix the bug") as HTMLInputElement).value).toBe("Fix the bug");
    expect((screen.getByDisplayValue("It crashes on login") as HTMLTextAreaElement).value).toBe("It crashes on login");
    expect((screen.getByDisplayValue("urgent") as HTMLInputElement).value).toBe("urgent");
  });

  it("calls onClose when the × button is clicked", async () => {
    const { onClose } = renderModal();
    await userEvent.click(screen.getByRole("button", { name: "×" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when the overlay backdrop is clicked", async () => {
    const { onClose } = renderModal();
    await userEvent.click(document.querySelector(".modal-overlay")!);
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onDelete with the card id and closes", async () => {
    const { onDelete, onClose } = renderModal();
    await userEvent.click(screen.getByRole("button", { name: /delete card/i }));
    expect(onDelete).toHaveBeenCalledWith("card-1");
    expect(onClose).toHaveBeenCalled();
  });

  it("submits updateCard mutation with changed values", async () => {
    const mocks = [
      {
        request: {
          query: UPDATE_CARD,
          variables: {
            id: "card-1",
            title: "Fixed the bug",
            description: "It crashes on login",
            assigneeId: mockUser.id,
            dueDate: "2026-12-31",
            labels: ["urgent"],
          },
        },
        result: { data: { updateCard: { id: "card-1", title: "Fixed the bug", description: "It crashes on login", dueDate: null, labels: ["urgent"], assignee: null } } },
      },
    ];
    const { onSaved, onClose } = renderModal(mocks);

    const titleInput = screen.getByDisplayValue("Fix the bug");
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Fixed the bug");
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await vi.waitFor(() => {
      expect(onSaved).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
