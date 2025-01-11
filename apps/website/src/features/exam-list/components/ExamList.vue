<script setup lang="ts">
import {
  IconFileDownload,
  IconLoader3,
  IconHelpOctagon,
  IconSparkles,
} from "@tabler/icons-vue";
import type {
  ColumnDef,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/vue-table";
import {
  FlexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useVueTable,
} from "@tanstack/vue-table";
import { h, onMounted, ref } from "vue";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import ExamListLoading from "./ExamListLoading.vue";
import { toast } from "@/components/ui/toast";

interface ExamItem {
  examTitle: string; // Tiêu đề bài thi
  uploadDate: string;
  examDetailsUrl: string; // Ngày tải lên
  isNew: boolean; // Cờ đánh dấu bài thi có mới hay không
  pagination: number; //  phân trang hiện tại
  row: number; // Số thứ tự dòng bài thi trong bảng
  isDown?: boolean;
}

type FetchResponse = {
  success: boolean;
  message: string;
  response: {
    data: ExamItem[];
  };
  meta: {
    currentPagination: string;
    nextPagination: string;
  };
};

type FetchFileResponse = {
  success: boolean;
  response: {
    data: {
      url: string;
    };
  };
  message: string;
};

const isMounted = ref(false);
const examsTotal = ref<ExamItem[]>([]);
const examsFrequency = ref<ExamItem[]>([]);
const exams = ref<ExamItem[]>([]);
const currentPagination = ref<string>();
const error = ref<boolean>(false);

const fetchingFlag = ref<{ isAuto: boolean; isFetching: boolean }>({
  isAuto: false,
  isFetching: false,
});

const isDownloading = ref<Boolean>(false);

const fetchPage = async (total: boolean) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/v1/pdaotao/scraping/examlist${total ? `?total=${total}` : ""}`,
    );

    const data: FetchResponse = await response.json();
    if (!data.success) {
      error.value = true;
      /*
      toast({
        title: "Lỗi",
        description: data.message,
        variant: "error",
      });
      */
      return;
    }
    currentPagination.value = data.meta.currentPagination;
    return data;
  } catch (error: any) {
    error.value = true;
    /* toast({
      title: "Lỗi",
      description: "Vui lòng thử lại sau",
      variant: "error",
    }); */
  } finally {
    fetchingFlag.value.isAuto = false;
    fetchingFlag.value.isFetching = false;
  }
};

// console.log(error.value);
onMounted(async () => {
  isMounted.value = true;
  // console.log("mounted");
  //updateColumnVisibility();
  //window.addEventListener("resize", updateColumnVisibility);
  const res = await fetchPage(false);
  if (res?.response) {
    exams.value = res.response.data;
    examsFrequency.value = res.response?.data;
  }
});

const fetchMore = async (isChecked: boolean) => {
  if (isChecked) {
    if (examsTotal.value.length > 0) {
      exams.value = [...exams.value, ...examsTotal.value];
    } else {
      fetchingFlag.value.isFetching = true;
      const res = await fetchPage(true);
      if (res?.response?.data) {
        examsTotal.value = res.response.data;
        exams.value = [...exams.value, ...res.response.data];
      }
    }
  } else {
    exams.value = examsFrequency.value;
  }
};

const columnFilters = ref<ColumnFiltersState>([]);
const columnVisibility = ref<VisibilityState>({
  examTitle: true,
  examDetailsUrl: true,
  uploadDate: true,
  isNew: false,
  page: true,
});

const updateColumnVisibility = () => {
  const isMd = window.matchMedia("(max-width: 768px)").matches;
  if (isMd) {
    columnVisibility.value = {
      ...columnVisibility.value,
      dateUpload: false,
    };
  } else {
    columnVisibility.value = {
      ...columnVisibility.value,
      dateUpload: true,
    };
  }
};

const columns: ColumnDef<ExamItem>[] = [
  {
    accessorKey: "uploadDate",
    header: "Ngày tải lên",
    cell: ({ row }) =>
      h("div", { class: "capitalize" }, row.getValue("uploadDate")),
  },

  {
    accessorKey: "isNew",
  },
  {
    id: "page",
    accessorFn: (row) => {
      return `${row.pagination}:${row.row} `;
    },
    header: "Số trang",
  },
  {
    accessorKey: "examTitle",
    header: "Mã Thi",
    cell: ({ row }) => {
      const text = row.getValue("examTitle");
      const isNew = row.getValue("isNew");
      return h("div", { class: "flex gap-2 items-center " }, [
        text as string,
        h("span", { class: "text-xs text-gray-500" }, [
          isNew
            ? h(IconSparkles, {
                class: "w-4 h-4 text-yellow-500 animate-pulse stroke-1",
              })
            : null,
        ]),
      ]);
    },
  },

  {
    accessorKey: "examDetailsUrl",
    header: "Tải xuống",
    cell: ({ row }) => {
      if (row.original.isDown === undefined) {
        row.original.isDown = false;
      }
      // row.original.isDown = ref(false);
      // const isDown = ref(false);
      const handleClick = async () => {
        // const msg = toast({
        //   title: "Đang gửi yêu cầu",
        //   description: "Vui lòng chờ trong giây lát",
        // });
        row.original.isDown = true;
        // isDown.value = true;
        // console.log(isDown.value);

        // console.log("Downloading from:", row.original.href);
        const match = /ID=(\d+)/.exec(row.original.examDetailsUrl);
        let id = "";

        if (match) {
          id = match[1];
        } else {
          id = "000000";
          console.error("Cannot found href.");
        }

        // console.log("Downloading from:", row.original.examDetailsUrl);
        const r = await fetch(
          `${import.meta.env.VITE_API_URL}/api/v1/pdaotao/scraping/examlist/${id}`,
        );

        const res: FetchFileResponse = await r.json();

        const url = res?.response?.data?.url;

        if (url && res?.success) {
          const link = url;
          const a = document.createElement("a");
          a.href = link;
          a.download = "";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          isDownloading.value = false;
          // isDown.value = false;
          row.original.isDown = false;

          // msg.dismiss();
        } else {
          isDownloading.value = false;
          // msg.dismiss();
          toast({
            title: "Lỗi",
            description: res?.message,
            variant: "error",
          });
        }
      };
      return h(
        "div",
        {
          onClick: () => {
            handleClick();
          },
        },
        row.original.isDown
          ? h(IconLoader3, {
              class:
                "w-6 h-6 cursor-pointer mx-auto text-primary/80 animate-spin-fast pointer-events-none",
            })
          : h(IconFileDownload, {
              class:
                "w-7 h-7 stroke-[1.25] cursor-pointer mx-auto text-primary/80 hover:text-primary hover:scale-150 transition-transform ease-in-out",
            }),
      );
    },
  },
];

function valueUpdater<T>(
  updaterOrValue: T | ((prev: T) => T),
  currentValue: T,
): T {
  // If updaterOrValue is a function, call it with the current value
  if (typeof updaterOrValue === "function") {
    return (updaterOrValue as (prev: T) => T)(currentValue);
  }

  // If it's not a function, directly return the new value
  return updaterOrValue;
}

const table = useVueTable({
  data: exams, // Ensure data is always an array
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  onColumnFiltersChange: (updaterOrValue) => {
    columnFilters.value = valueUpdater(updaterOrValue, columnFilters.value);
  },
  onColumnVisibilityChange: (updaterOrValue) => {
    columnVisibility.value = valueUpdater(
      updaterOrValue,
      columnVisibility.value,
    );
  },
  state: {
    get columnFilters() {
      return columnFilters.value;
    },
    get columnVisibility() {
      return columnVisibility.value;
    },
  },
});
</script>

<template>
  <div v-if="error" class="flex-1 flex flex-col items-center justify-center">
    <p class="text-red-500 text-3xl">Lỗi khi tải dữ liệu</p>
    <p>Vui lòng thử lại sau!</p>
  </div>
  <div v-else-if="!isMounted || exams.length <= 0">
    <ExamListLoading />
  </div>
  <div v-else class="flex-1 flex flex-col gap-5">
    <div class="relative w-full max-w-xl m-auto">
      <Input
        id="search"
        type="text"
        placeholder="Tìm kiếm"
        class="pl-10 w-full"
        :model-value="table.getColumn('examTitle')?.getFilterValue() as string"
        @update:model-value="
          table.getColumn('examTitle')?.setFilterValue($event)
        "
      />
      <span
        class="absolute start-0 inset-y-0 flex items-center justify-center px-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-6 text-muted-foreground"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
      </span>
    </div>

    <div class="flex gap-3 items-center">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger class="flex items-center w-fit gap-3">
            <Switch
              id="term"
              @update:checked="fetchMore"
              :disabled="fetchingFlag.isFetching"
            />
            <Label for="term">Tất cả</Label>
          </TooltipTrigger>
          <TooltipContent>
            <p>Bật để lấy tất cả trang</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <div class="relative">
        <p>
          ({{ exams[exams.length - 1].pagination }}
          trang đã được tải)
        </p>
        <span
          v-if="fetchingFlag.isFetching"
          class="absolute flex h-3 w-3 top-[-10px] right-0"
        >
          <span
            class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            :class="[fetchingFlag.isAuto ? 'bg-primary' : 'bg-blue-500']"
          ></span>
          <span
            class="relative inline-flex rounded-full h-3 w-3"
            :class="[fetchingFlag.isAuto ? 'bg-primary' : 'bg-blue-500']"
          ></span>
        </span>
      </div>
      <Popover>
        <PopoverTrigger>
          <IconHelpOctagon class="w-5 h-5 text-primary" />
        </PopoverTrigger>
        <PopoverContent>
          <p>Theo mặc định hệ thống tự tải những danh sách mới nhất</p>
          <p>
            <span class="text-primary">Màu đỏ</span> Hệ thống đang tự tải trang
          </p>
          <p>
            <span class="text-blue-500">Màu xanh biển</span> Chức năng lấy tất
            đang được bật
          </p>
        </PopoverContent>
      </Popover>
    </div>

    <Table>
      <TableHeader>
        <TableRow
          v-for="headerGroup in table.getHeaderGroups()"
          :key="headerGroup.id"
        >
          <TableHead
            :class="[
              'font-bold text-primary ',
              header.column.id === 'examDetailsUrl'
                ? 'text-center'
                : 'text-left',
            ]"
            v-for="header in headerGroup.headers"
            :key="header.id"
          >
            <FlexRender
              :render="header.column.columnDef.header"
              :props="header.getContext()"
            />
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody class="text-base">
        <template v-if="table.getRowModel().rows?.length">
          <TableRow v-for="row in table.getRowModel().rows" :key="row.id">
            <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
              <FlexRender
                :render="cell.column.columnDef.cell"
                :props="cell.getContext()"
              />
            </TableCell>
          </TableRow>
        </template>
        <template v-else>
          <TableRow>
            <TableCell :colspan="columns.length" class="h-24 text-center">
              Không có dữ liệu
            </TableCell>
          </TableRow>
        </template>
      </TableBody>
    </Table>

    <div v-if="fetchingFlag.isFetching">
      <ExamListLoading :isShowHeader="false" />
    </div>
  </div>
</template>
